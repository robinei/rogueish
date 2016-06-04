import { Color, colors, toStringColor } from "./color";


export {
    Display,
    makeDisplay,
}



interface Display {
    charDim: number;
    width: number;
    height: number;
    char: number[];
    fg: Color[];
    bg: Color[];
    reshape(): void;
    redraw(): void;
}

function makeDisplay(canvas: HTMLCanvasElement, fontImage: HTMLImageElement, onDraw: () => void): Display {
    try {
        const display = new GLCanvasDisplay(canvas, fontImage, onDraw);
        if (display.isValid()) {
            console.log("Using WebGL display.");
            return display;
        } else {
            console.log("WebGL not supported! Using regular canvas display.");
            return new NormalCanvasDisplay(canvas, fontImage, onDraw);
        }
    } catch (error) {
        console.log("Error creating WebGL display: " + error);
        return undefined;
    }
}






const VERTEX_SHADER_CODE = [
    "precision mediump float;",
    "uniform float charDim;",
    "uniform mat4 projectionMatrix;",
    "attribute vec4 position;",
    "attribute vec4 bgColor;",
    "attribute vec4 fgColor;",
    "varying vec4 bgColorOut;",
    "varying vec4 fgColorOut;",
    "varying float charCodeOut;",
    "void main() {",
    `gl_PointSize = charDim;`,
    "gl_Position = projectionMatrix * vec4(position.xy, 0.0, 1.0);",
    "bgColorOut = bgColor;",
    "fgColorOut = fgColor;",
    "charCodeOut = position.z;", // get char code from position
    "}"
].join("\n");

const FRAGMENT_SHADER_CODE = [
    "precision mediump float;",
    "uniform float charDim;",
    "uniform sampler2D texture;",
    "varying vec4 bgColorOut;",
    "varying vec4 fgColorOut;",
    "varying float charCodeOut;",
    "void main() {",
    "float y = floor(charCodeOut / 16.0);",
    "float x = charCodeOut - 16.0 * y;",
    "float tx = (x + gl_PointCoord.x) / 16.0;",
    "float ty = (y + gl_PointCoord.y) / 16.0;",
    "vec4 c = fgColorOut * texture2D(texture, vec2(tx, ty));",
    "gl_FragColor = (1.0 - c.a) * bgColorOut + c.a * c;",
    "}"
].join("\n");

const VERTEX_STRIDE = 12;


class GLCanvasDisplay implements Display {
    charDim: number;
    count = 0;
    width = 0;
    height = 0;
    char = [0];
    fg = [colors.white];
    bg = [colors.black];

    private gl: WebGLRenderingContext;
    private bufferArray: Float32Array;
    private onReshape: () => void;

    constructor(private canvas: HTMLCanvasElement, private fontImage: HTMLImageElement, private onDraw: () => void) {
        this.fontImage = fontImage;
        this.charDim = ~~(fontImage.naturalWidth / 16);

        const onError = (e: WebGLContextEvent) => {
            console.log("Error creating WebGL context: " + e.statusMessage);
        };
        const onLost = (e: WebGLContextEvent) => {
            console.log("Lost WebGL context");
            this.gl = null;
            e.preventDefault();
        };
        const onRestore = (e: WebGLContextEvent) => {
            console.log("Restoring WebGL context");
            this.createContext();
        };

        canvas.addEventListener("webglcontextcreationerror", onError, false);
        canvas.addEventListener("webglcontextlost", onLost, false);
        canvas.addEventListener("webglcontextrestored", onRestore, false);

        this.createContext();

        if (!this.isValid()) {
            canvas.removeEventListener("webglcontextcreationerror", onError);
            canvas.removeEventListener("webglcontextlost", onLost);
            canvas.removeEventListener("webglcontextrestored", onRestore);
        }
    }

    public isValid(): boolean {
        return !!this.gl;
    }

    private createContext(): void {
        const { canvas } = this;
        const gl = this.gl = <WebGLRenderingContext>(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
        if (!gl) {
            return;
        }

        const vertexShader = compileShader(gl, VERTEX_SHADER_CODE, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(gl, FRAGMENT_SHADER_CODE, gl.FRAGMENT_SHADER);
        const shaderProgram = createProgram(gl, vertexShader, fragmentShader);
        gl.useProgram(shaderProgram);

        const charDimUniform = gl.getUniformLocation(shaderProgram, "charDim");
        checkGlError(gl, "getUniformLocation");
        const textureUniform = gl.getUniformLocation(shaderProgram, "texture");
        checkGlError(gl, "getUniformLocation");
        const projectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
        checkGlError(gl, "getUniformLocation");

        const vertexStride = 12;
        const buffer = gl.createBuffer();
        checkGlError(gl, "createBuffer");
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        checkGlError(gl, "bindBuffer");

        const positionAttribute = gl.getAttribLocation(shaderProgram, "position");
        checkGlError(gl, "getAttribLocation");
        gl.enableVertexAttribArray(positionAttribute);
        checkGlError(gl, "enableVertexAttribArray");
        gl.vertexAttribPointer(positionAttribute, 4, gl.FLOAT, false, vertexStride * 4, 0);
        checkGlError(gl, "vertexAttribPointer");

        const fgColorAttribute = gl.getAttribLocation(shaderProgram, "fgColor");
        checkGlError(gl, "getAttribLocation");
        gl.enableVertexAttribArray(fgColorAttribute);
        checkGlError(gl, "enableVertexAttribArray");
        gl.vertexAttribPointer(fgColorAttribute, 4, gl.FLOAT, false, vertexStride * 4, 4 * 4);
        checkGlError(gl, "vertexAttribPointer");

        const bgColorAttribute = gl.getAttribLocation(shaderProgram, "bgColor");
        checkGlError(gl, "getAttribLocation");
        gl.enableVertexAttribArray(bgColorAttribute);
        checkGlError(gl, "enableVertexAttribArray");
        gl.vertexAttribPointer(bgColorAttribute, 4, gl.FLOAT, false, vertexStride * 4, 8 * 4);
        checkGlError(gl, "vertexAttribPointer");

        const fontTexture = gl.createTexture();
        checkGlError(gl, "createTexture");
        gl.bindTexture(gl.TEXTURE_2D, fontTexture);
        checkGlError(gl, "bindTexture");
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        checkGlError(gl, "texParameteri");
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.fontImage);
        checkGlError(gl, "texImage2D");

        gl.uniform1f(charDimUniform, this.charDim);
        checkGlError(gl, "uniform1f");
        gl.uniform1i(textureUniform, 0);
        checkGlError(gl, "uniform1f");
        gl.activeTexture(gl.TEXTURE0);
        checkGlError(gl, "activeTexture");

        gl.clearColor(0, 0, 0, 1);
        checkGlError(gl, "clearColor");
        gl.disable(gl.DEPTH_TEST);
        checkGlError(gl, "disable");
        gl.disable(gl.CULL_FACE);
        checkGlError(gl, "disable");
        gl.depthMask(false);
        checkGlError(gl, "depthMask");

        const projectionMatrixArray = new Float32Array(16);
        this.onReshape = () => {
            if (!this.isValid()) {
                return;
            }
            this.bufferArray = new Float32Array(this.count * VERTEX_STRIDE);
            gl.viewport(0, 0, canvas.width, canvas.height);
            checkGlError(gl, "viewport");
            orthoProjectionMatrix(0, canvas.width, canvas.height, 0, -1, 1, projectionMatrixArray); // top left origin
            gl.uniformMatrix4fv(projectionMatrixUniform, false, projectionMatrixArray);
            checkGlError(gl, "uniformMatrix4fv");
        };

        this.reshape();
    }




    reshape() {
        this.width = Math.ceil(this.canvas.width / this.charDim);
        this.height = Math.ceil(this.canvas.height / this.charDim);
        this.count = this.width * this.height;
        console.log(`Reshaped display: ${this.width} x ${this.height}`)

        this.char.length = this.count;
        this.fg.length = this.count;
        this.bg.length = this.count;

        this.onReshape();

        this.redraw();
    }

    redraw() {
        window.requestAnimationFrame(() => this.draw());
    }

    draw() {
        if (!this.isValid()) {
            return;
        }
        const { charDim, count, width, height, char, fg, bg, gl, bufferArray } = this;

        char.length = count;
        fg.length = count;
        bg.length = count;
        for (let i = 0; i < count; ++i) {
            char[i] = 0;
            fg[i] = colors.white;
            bg[i] = colors.black;
        }

        this.onDraw();

        gl.clear(gl.COLOR_BUFFER_BIT);
        checkGlError(gl, "clear");
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const i = y * width + x;
                const off = i * VERTEX_STRIDE;
                const fgc = fg[i];
                const bgc = bg[i];

                bufferArray[off + 0] = charDim * x + charDim / 2;
                bufferArray[off + 1] = charDim * y + charDim / 2;
                bufferArray[off + 2] = char[i]; // we sneak char code along with position
                bufferArray[off + 3] = 0;

                bufferArray[off + 4] = (<any>fgc >>> 24) / 255.0;
                bufferArray[off + 5] = ((<any>fgc >>> 16) & 255) / 255.0;
                bufferArray[off + 6] = ((<any>fgc >>> 8) & 255) / 255.0;
                bufferArray[off + 7] = (<any>fgc & 255) / 255.0;

                bufferArray[off + 8] = (<any>bgc >>> 24) / 255.0;
                bufferArray[off + 9] = ((<any>bgc >>> 16) & 255) / 255.0;
                bufferArray[off + 10] = ((<any>bgc >>> 8) & 255) / 255.0;
                bufferArray[off + 11] = (<any>bgc & 255) / 255.0;
            }
        }
        gl.bufferData(gl.ARRAY_BUFFER, bufferArray, gl.STREAM_DRAW);
        checkGlError(gl, "bufferData");
        gl.drawArrays(gl.POINTS, 0, count);
        checkGlError(gl, "drawArrays");
    }
}

/**
 * Creates and compiles a shader.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} shaderSource The GLSL source code for the shader.
 * @param {number} shaderType The type of shader, VERTEX_SHADER or
 *     FRAGMENT_SHADER.
 * @return {!WebGLShader} The shader.
 */
function compileShader(gl: WebGLRenderingContext, shaderSource: string, shaderType: number): WebGLShader {
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        throw new Error("could not compile shader: " + gl.getShaderInfoLog(shader));
    }
    return shader;
}

/**
 * Creates a program from 2 shaders.
 *
 * @param {!WebGLRenderingContext) gl The WebGL context.
 * @param {!WebGLShader} vertexShader A vertex shader.
 * @param {!WebGLShader} fragmentShader A fragment shader.
 * @return {!WebGLProgram} A program.
 */
function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        throw new Error("program filed to link: " + gl.getProgramInfoLog (program));
    }
    return program;
}

/**
 * Throws an exception if the last operation caused an error.
 *
 * @param {!WebGLRenderingContext) gl The WebGL context.
 * @param {!string} Name of the last operation.
 */
function checkGlError(gl: WebGLRenderingContext, operation: string): void {
    const error = gl.getError();
    if (error != gl.NO_ERROR && error != gl.CONTEXT_LOST_WEBGL) {
        const msg = `WebGL error (${operation}): ${error}`;
        console.log(msg);
        throw new Error(msg);
    }
}

function orthoProjectionMatrix(left: number, right: number, bottom: number, top: number, zNear: number, zFar: number, result: Float32Array) {
    // 0 4  8 12
    // 1 5  9 13
    // 2 6 10 14
    // 3 7 11 15
    result[0] = 2 / (right - left);
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = 2 / (top - bottom);
    result[6] = 0;
    result[7] = 0;
    result[8] = 0;
    result[9] = 0;
    result[10] = -2 / (zFar - zNear);
    result[11] = 0;
    result[12] = -(right + left) / (right - left);
    result[13] = -(top + bottom) / (top - bottom);
    result[14] = -(zFar + zNear) / (zFar - zNear);
    result[15] = 1;
}






class NormalCanvasDisplay implements Display {
    charDim: number;
    width = 0;
    height = 0;
    count = 0;
    char = [0];
    fg = [colors.white];
    bg = [colors.black];

    private prevWidth = 0;
    private prevHeight = 0;
    private prevChar = [0];
    private prevFg = [colors.white];
    private prevBg = [colors.black];

    private dirty = [false];
    private allDirty = true;

    private context: CanvasRenderingContext2D;


    constructor(private canvas: HTMLCanvasElement, private fontImage: HTMLImageElement, private onDraw: () => void) {
        this.context = canvas.getContext("2d");
        this.charDim = ~~(fontImage.naturalWidth / 16);
    }


    reshape() {
        this.width = Math.ceil(this.canvas.width / this.charDim);
        this.height = Math.ceil(this.canvas.height / this.charDim);
        this.count = this.width * this.height;
        console.log(`Reshaped display: ${this.width} x ${this.height}`)

        this.char.length = this.count;
        this.fg.length = this.count;
        this.bg.length = this.count;
        this.dirty.length = this.count;
        this.allDirty = true;

        this.redraw();
    }

    redraw() {
        window.requestAnimationFrame(() => this.draw());
    }

    draw() {
        const { black, white } = colors;
        const {
            count, width, height, char, fg, bg,
            prevWidth, prevHeight, prevChar, prevFg, prevBg,
            dirty, allDirty, context, charDim, fontImage
        } = this;

        char.length = count;
        fg.length = count;
        bg.length = count;
        for (let i = 0; i < count; ++i) {
            char[i] = 0;
            fg[i] = white;
            bg[i] = black;
        }

        this.onDraw();

        let dirtyCount = 0;
        let currFillColor: Color = undefined;

        context.globalCompositeOperation = "source-over";

        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const i = y * width + x;
                if (!allDirty) {
                    if (x < prevWidth && y < prevHeight) {
                        const j = y * prevWidth + x;
                        dirty[i] = char[i] !== prevChar[j] || fg[i] !== prevFg[j] || bg[i] !== prevBg[j];
                    } else {
                        dirty[i] = true;
                    }
                    if (!dirty[i]) {
                        continue;
                    }
                }
                ++dirtyCount;

                // now we draw the background using "source-over" (the fastest mode)
                // for cells which aren't black (because that is the default background color),
                // and which have white (or invisible) foreground characters.
                // non-white (and visible) characters need background drawn last, using "destination-over", so skip them for now.
                if (bg[i] === black || fg[i] !== white && char[i] !== 0 && char[i] !== 32) {
                    context.clearRect(x * charDim, y * charDim, charDim, charDim);
                } else {
                    if (currFillColor !== bg[i]) {
                        context.fillStyle = toStringColor(bg[i]);
                        currFillColor = bg[i];
                    }
                    context.fillRect(x * charDim, y * charDim, charDim, charDim);
                }

                if (char[i] === 0 || char[i] === 32) {
                    continue;
                }
                // draw the foreground characters (using a white font)
                const sx = (char[i] % 16) * charDim;
                const sy = Math.floor(char[i] / 16) * charDim;
                context.drawImage(fontImage, sx, sy, charDim, charDim, x * charDim, y * charDim, charDim, charDim);
            }
        }

        // apply color onto non-white characters (this is why background must come last for these cells)
        context.globalCompositeOperation = "source-atop";
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const i = y * width + x;
                if (!allDirty && !dirty[i]) {
                    continue;
                }
                if (fg[i] === white || char[i] === 0 || char[i] === 32) {
                    continue; // white or invisible characters don't need to be colored
                }
                if (currFillColor !== fg[i]) {
                    context.fillStyle = toStringColor(fg[i]);
                    currFillColor = fg[i];
                }
                context.fillRect(x * charDim, y * charDim, charDim, charDim);
            }
        }

        // draw background underneath visible non-white characters
        context.globalCompositeOperation = "destination-over";
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const i = y * width + x;
                if (!allDirty && !dirty[i]) {
                    continue;
                }
                if (bg[i] === black || fg[i] === white || char[i] === 0 || char[i] === 32) {
                    continue; // black bg, white fg (or invisible) cells have already had their background drawn
                }
                if (currFillColor !== bg[i]) {
                    context.fillStyle = toStringColor(bg[i]);
                    currFillColor = bg[i];
                }
                context.fillRect(x * charDim, y * charDim, charDim, charDim);
            }
        }

        context.globalCompositeOperation = "source-over";

        this.char = prevChar;
        this.fg = prevFg;
        this.bg = prevBg;

        this.prevChar = char;
        this.prevFg = fg;
        this.prevBg = bg;
        this.prevWidth = width;
        this.prevHeight = height;

        this.allDirty = false;

        // console.log("redraw " + dirtyCount + "/" + count);
    }
}
