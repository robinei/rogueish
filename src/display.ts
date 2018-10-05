import { Color, colors, toStringColor } from "./color";
import { isMobileSafari, isInteger } from "./util";


export {
    Display,
    makeDisplay,
    makeCanvasDisplay,
    makeNullDisplay,
};



interface Display {
    readonly charWidth: number;
    readonly charHeight: number;
    readonly width: number;
    readonly height: number;
    readonly char: number[];
    readonly fg: Color[];
    readonly bg: Color[];
    reshape(force: boolean): void;
    redraw(): void;
    destroy(): void;
}

function makeDisplay(canvas: HTMLCanvasElement, fontImage: HTMLImageElement, onDraw: () => void): Display {
    if (isMobileSafari()) {
        console.log("Prefering 2D canvas on iOS.");
        return makeCanvasDisplay(canvas, fontImage, onDraw);
    }
    const display = new GLCanvasDisplay(canvas, fontImage, onDraw);
    if (display.isValid()) {
        console.log("Creating WebGL display.");
        return display;
    } else {
        console.log("WebGL not supported!");
        return makeCanvasDisplay(canvas, fontImage, onDraw);
    }
}

function makeCanvasDisplay(canvas: HTMLCanvasElement, fontImage: HTMLImageElement, onDraw: () => void): Display {
    console.log("Creating regular canvas display.");
    return new NormalCanvasDisplay(canvas, fontImage, onDraw);
}

function makeNullDisplay(): Display {
    return {
        charWidth: 0,
        charHeight: 0,
        width: 0,
        height: 0,
        char: [],
        fg: [],
        bg: [],
        reshape: (force: boolean) => {},
        redraw: () => {},
        destroy: () => {},
    };
}



abstract class BaseDisplay {
    count = 0;
    width = 0;
    height = 0;
    char = [0];
    fg = [colors.white];
    bg = [colors.black];

    protected onReshaped?: () => void;

    readonly charWidth: number;
    readonly charHeight: number;
    private wantRedraw: boolean = false;
    private redrawScheduled: boolean = false;

    constructor(
        protected readonly canvas: HTMLCanvasElement,
        protected readonly fontImage: HTMLImageElement,
        protected readonly onDraw: () => void,
    ) {
        this.charWidth = ~~(fontImage.naturalWidth / 16);
        this.charHeight = ~~(fontImage.naturalHeight / 16);
    }

    abstract draw(): void;

    redraw() {
        if (this.redrawScheduled) {
            this.wantRedraw = true;
        } else {
            this.scheduleRedraw();
        }
    }

    scheduleRedraw() {
        this.redrawScheduled = true;
        window.requestAnimationFrame(() => {
            this.redrawScheduled = false;
            this.draw();
            if (this.wantRedraw) {
                this.wantRedraw = false;
                this.scheduleRedraw();
            }
        });
    }

    reshape(force: boolean) {
        const width = Math.ceil(window.innerWidth / this.charWidth);
        const height = Math.ceil(window.innerHeight / this.charHeight);
        if (!force && width === this.width && height === this.height) {
            return;
        }
        if (isInteger(window.devicePixelRatio)) {
            this.canvas.classList.add("pixelated-canvas");
        } else {
            this.canvas.classList.remove("pixelated-canvas");
        }
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = width;
        this.height = height;
        this.count = width * height;
        console.log(`Reshaped display: ${width} x ${height} (${this.canvas.width} x ${this.canvas.height})`);

        this.char.length = this.count;
        this.fg.length = this.count;
        this.bg.length = this.count;

        if (this.onReshaped) {
            this.onReshaped();
        }

        this.redraw();
    }
}






const VERTEX_SHADER_CODE = [
    "precision mediump float;",
    "attribute vec4 position;",
    "void main() {",
    "gl_Position = position;",
    "}",
].join("\n");

const FRAGMENT_SHADER_CODE = [
    "precision mediump float;",
    "uniform float renderWidth;",
    "uniform float renderHeight;",
    "uniform float canvasHeight;",
    "uniform float charWidth;",
    "uniform float charHeight;",
    "uniform sampler2D fontTexture;",
    "uniform sampler2D atlasTexture;",
    "void main() {",

    "float x = gl_FragCoord.x / renderWidth;",
    "float y = (canvasHeight - gl_FragCoord.y) / renderHeight;",

    "vec4 fg = texture2D(atlasTexture, vec2(x, y * 0.5));",
    "vec4 bg = texture2D(atlasTexture, vec2(x, 0.5 + y * 0.5));",

    "float cx = mod(gl_FragCoord.x, charWidth) / charWidth;",
    "float cy = mod(canvasHeight - gl_FragCoord.y, charHeight) / charHeight;",

    "float ch = bg.a * 255.0;",
    "float j = floor(ch / 16.0);",
    "float i = ch - 16.0 * j;",

    "float tx = (i + cx) / 16.0;",
    "float ty = (j + cy) / 16.0;",
    "vec4 c = fg * texture2D(fontTexture, vec2(tx, ty));",

    "gl_FragColor = vec4((1.0 - c.a) * bg.rgb + c.a * c.rgb, 1.0);",
    "}",
].join("\n");

class GLCanvasDisplay extends BaseDisplay implements Display {
    private gl: WebGLRenderingContext | undefined;

    private fontTexture?: WebGLTexture;
    private atlasTexture?: WebGLTexture;
    private atlasBuffer?: Uint8Array;

    private removeEventListeners: () => void;
    private deleteGLHandles?: () => void;

    constructor(
        canvas: HTMLCanvasElement,
        fontImage: HTMLImageElement,
        onDraw: () => void,
    ) {
        super(canvas, fontImage, onDraw);

        const onError = (e: WebGLContextEvent) => {
            console.log("Error creating WebGL context: " + e.statusMessage);
        };
        const onLost = (e: WebGLContextEvent) => {
            console.log("Lost WebGL context");
            this.gl = undefined;
            e.preventDefault();
        };
        const onRestore = (e: WebGLContextEvent) => {
            console.log("Restoring WebGL context");
            this.createContext();
        };

        this.removeEventListeners = () => {
            canvas.removeEventListener("webglcontextcreationerror", onError as EventListener);
            canvas.removeEventListener("webglcontextlost", onLost as EventListener);
            canvas.removeEventListener("webglcontextrestored", onRestore as EventListener);
        };

        canvas.addEventListener("webglcontextcreationerror", onError as EventListener, false);
        canvas.addEventListener("webglcontextlost", onLost as EventListener, false);
        canvas.addEventListener("webglcontextrestored", onRestore as EventListener, false);

        this.createContext();

        if (!this.isValid()) {
            this.removeEventListeners();
        }
    }

    isValid(): boolean {
        return !!this.gl;
    }

    destroy(): void {
        if (this.isValid()) {
            this.removeEventListeners();
            if (this.deleteGLHandles) {
                this.deleteGLHandles();
            }
            this.gl = undefined;
        }
    }

    draw() {
        const { count, width, height, char, fg, bg, gl, atlasBuffer } = this;
        if (!gl || !atlasBuffer) {
            return;
        }

        for (let i = 0; i < count; ++i) {
            char[i] = 0;
            fg[i] = colors.white;
            bg[i] = colors.black;
        }

        this.onDraw();

        for (let i = 0, off = 0; i < count; ++i, off += 4) {
            const fgc = fg[i];
            atlasBuffer[off + 0] = <any>fgc >>> 24;
            atlasBuffer[off + 1] = (<any>fgc >>> 16) & 255;
            atlasBuffer[off + 2] = (<any>fgc >>> 8) & 255;
            atlasBuffer[off + 3] = <any>fgc & 255;
        }
        for (let i = 0, off = count * 4; i < count; ++i, off += 4) {
            const bgc = bg[i];
            atlasBuffer[off + 0] = <any>bgc >>> 24;
            atlasBuffer[off + 1] = (<any>bgc >>> 16) & 255;
            atlasBuffer[off + 2] = (<any>bgc >>> 8) & 255;
            atlasBuffer[off + 3] = char[i]; // we sneak char code along with background color
        }
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height * 2, gl.RGBA, gl.UNSIGNED_BYTE, atlasBuffer);
        checkGlError(gl, "texSubImage2D");
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        checkGlError(gl, "drawArrays");
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

        const renderWidthUniform = gl.getUniformLocation(shaderProgram, "renderWidth");
        checkGlError(gl, "getUniformLocation");
        const renderHeightUniform = gl.getUniformLocation(shaderProgram, "renderHeight");
        checkGlError(gl, "getUniformLocation");
        const canvasHeightUniform = gl.getUniformLocation(shaderProgram, "canvasHeight");
        checkGlError(gl, "getUniformLocation");
        const charWidthUniform = gl.getUniformLocation(shaderProgram, "charWidth");
        checkGlError(gl, "getUniformLocation");
        const charHeightUniform = gl.getUniformLocation(shaderProgram, "charHeight");
        checkGlError(gl, "getUniformLocation");
        const fontTextureUniform = gl.getUniformLocation(shaderProgram, "fontTexture");
        checkGlError(gl, "getUniformLocation");
        const atlasTextureUniform = gl.getUniformLocation(shaderProgram, "atlasTexture");
        checkGlError(gl, "getUniformLocation");

        const vertexBuffer = gl.createBuffer();
        checkGlError(gl, "createBuffer");
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        checkGlError(gl, "bindBuffer");
        const vertexBufferArray = new Float32Array([
            -1, 1, 0, 1,
            -1, -1, 0, 1,
            1, 1, 0, 1,
            1, -1, 0, 1,
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, vertexBufferArray, gl.STATIC_DRAW);
        checkGlError(gl, "bufferData");

        const positionAttribute = gl.getAttribLocation(shaderProgram, "position");
        checkGlError(gl, "getAttribLocation");
        gl.enableVertexAttribArray(positionAttribute);
        checkGlError(gl, "enableVertexAttribArray");
        gl.vertexAttribPointer(positionAttribute, 4, gl.FLOAT, false, 0, 0);
        checkGlError(gl, "vertexAttribPointer");


        gl.activeTexture(gl.TEXTURE0);
        const fontTexture = this.fontTexture = makeTexture(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.fontImage);
        checkGlError(gl, "texImage2D");

        gl.activeTexture(gl.TEXTURE1);
        const atlasTexture = this.atlasTexture = makeTexture(gl);

        gl.uniform1i(fontTextureUniform, 0);
        checkGlError(gl, "uniform1f");
        gl.uniform1i(atlasTextureUniform, 1);
        checkGlError(gl, "uniform1f");
        gl.uniform1f(charWidthUniform, this.charWidth);
        checkGlError(gl, "uniform1f");
        gl.uniform1f(charHeightUniform, this.charHeight);
        checkGlError(gl, "uniform1f");

        gl.clearColor(0, 0, 0, 1);
        checkGlError(gl, "clearColor");
        gl.disable(gl.DEPTH_TEST);
        checkGlError(gl, "disable");
        gl.disable(gl.CULL_FACE);
        checkGlError(gl, "disable");
        gl.depthMask(false);
        checkGlError(gl, "depthMask");

        this.deleteGLHandles = () => {
            gl.deleteProgram(shaderProgram);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteBuffer(vertexBuffer);
            gl.deleteTexture(fontTexture);
            gl.deleteTexture(atlasTexture);
            this.fontTexture = undefined;
            this.atlasTexture = undefined;
        };

        this.onReshaped = () => {
            if (!this.isValid()) {
                return;
            }
            this.atlasBuffer = new Uint8Array(this.width * this.height * 4 * 2);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height * 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.atlasBuffer);
            checkGlError(gl, "texImage2D");

            gl.uniform1f(renderWidthUniform, this.width * this.charWidth);
            checkGlError(gl, "uniform1f");
            gl.uniform1f(renderHeightUniform, this.height * this.charHeight);
            checkGlError(gl, "uniform1f");

            gl.uniform1f(canvasHeightUniform, canvas.height);
            checkGlError(gl, "uniform1f");

            gl.viewport(0, 0, canvas.width, canvas.height);
            checkGlError(gl, "viewport");
        };

        this.reshape(true);
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
    const shader = gl.createShader(shaderType);
    if (!shader) {
        throw new Error("error creating shader");
    }
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
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
    const program = gl.createProgram();
    if (!program) {
        throw new Error("error creating program");
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
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
    if (error !== gl.NO_ERROR && error !== gl.CONTEXT_LOST_WEBGL) {
        const msg = `WebGL error (${operation}): ${error}`;
        console.log(msg);
        throw new Error(msg);
    }
}

function makeTexture(gl: WebGLRenderingContext): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) {
        throw new Error("error creating texture");
    }
    checkGlError(gl, "createTexture");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    checkGlError(gl, "bindTexture");
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    checkGlError(gl, "texParameteri");
    return texture;
}




class NormalCanvasDisplay extends BaseDisplay implements Display {
    private prevWidth = 0;
    private prevHeight = 0;
    private prevChar = [0];
    private prevFg = [colors.white];
    private prevBg = [colors.black];

    private readonly dirty = [false];
    private allDirty = true;

    private context?: CanvasRenderingContext2D;

    constructor(
        canvas: HTMLCanvasElement,
        fontImage: HTMLImageElement,
        onDraw: () => void,
    ) {
        super(canvas, fontImage, onDraw);
        this.reshape(true);
    }

    destroy(): void {
    }

    onReshaped = () => {
        this.dirty.length = this.count;
        this.allDirty = true;

        const context = this.canvas.getContext("2d");
        if (!context) {
            throw new Error("error getting context");
        }
        this.context = context;
        const smooth = !isInteger(window.devicePixelRatio);
        context.imageSmoothingEnabled = smooth;
        (context as any).mozImageSmoothingEnabled = smooth;
        (context as any).webkitImageSmoothingEnabled = smooth;
        (context as any).msImageSmoothingEnabled = smooth;
    }

    draw() {
        const { black, white } = colors;
        const {
            count, width, height, char, fg, bg,
            prevWidth, prevHeight, prevChar, prevFg, prevBg,
            dirty, allDirty, context, charWidth, charHeight, fontImage,
        } = this;

        if (!context) {
            return;
        }

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
        let currFillColor: Color | undefined = undefined;

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
                    context.clearRect(x * charWidth, y * charHeight, charWidth, charHeight);
                } else {
                    if (currFillColor !== bg[i]) {
                        context.fillStyle = toStringColor(bg[i]);
                        currFillColor = bg[i];
                    }
                    context.fillRect(x * charWidth, y * charHeight, charWidth, charHeight);
                }

                if (char[i] === 0 || char[i] === 32) {
                    continue;
                }
                // draw the foreground characters (using a white font)
                const sx = (char[i] % 16) * charWidth;
                const sy = ~~(char[i] / 16) * charHeight;
                context.drawImage(fontImage, sx, sy, charWidth, charHeight, x * charWidth, y * charHeight, charWidth, charHeight);
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
                context.fillRect(x * charWidth, y * charHeight, charWidth, charHeight);
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
                context.fillRect(x * charWidth, y * charHeight, charWidth, charHeight);
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
