var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("color", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var colors = {
        clear: makeColor(0x00, 0x00, 0x00, 0x00),
        white: makeColor(0xff, 0xff, 0xff),
        silver: makeColor(0xc0, 0xc0, 0xc0),
        gray: makeColor(0x80, 0x80, 0x80),
        black: makeColor(0x00, 0x00, 0x00),
        red: makeColor(0xff, 0x00, 0x00),
        maroon: makeColor(0x80, 0x00, 0x00),
        yellow: makeColor(0xff, 0xff, 0x00),
        olive: makeColor(0x80, 0x80, 0x00),
        lime: makeColor(0x00, 0xff, 0x00),
        green: makeColor(0x00, 0x80, 0x00),
        aqua: makeColor(0x00, 0xff, 0xff),
        teal: makeColor(0x00, 0x80, 0x80),
        blue: makeColor(0x00, 0x00, 0xff),
        navy: makeColor(0x00, 0x00, 0x80),
        fuchsia: makeColor(0xff, 0x00, 0xff),
        purple: makeColor(0x80, 0x00, 0x80),
    };
    exports.colors = colors;
    function makeColor(r, g, b, a) {
        if (a === void 0) { a = 255; }
        if (r > 255) {
            r = 255;
        }
        if (g > 255) {
            g = 255;
        }
        if (b > 255) {
            b = 255;
        }
        if (a > 255) {
            a = 255;
        }
        return (((r << 24) >>> 0) | ((g << 16) | (b << 8) | a)) >>> 0;
    }
    exports.makeColor = makeColor;
    function parseColor(str) {
        if (str.charAt(0) === "#") {
            if (str.length === 7) {
                return (((parseInt(str.substr(1), 16) << 8) >>> 0) | 255) >>> 0;
            }
            throw new Error("expected 6 digit hex value: " + str);
        }
        if (str.indexOf("rgba(") === 0) {
            str = str.substring(5);
            str = str.substring(0, str.length - 1);
            var parts = str.split(",");
            var r = parseInt(parts[0], 10);
            var g = parseInt(parts[1], 10);
            var b = parseInt(parts[2], 10);
            var a = ~~(parseFloat(parts[3]) * 255);
            return makeColor(r, g, b, a);
        }
        if (str.indexOf("rgb(") === 0) {
            str = str.substring(4);
            str = str.substring(0, str.length - 1);
            var parts = str.split(",");
            var r = parseInt(parts[0], 10);
            var g = parseInt(parts[1], 10);
            var b = parseInt(parts[2], 10);
            return makeColor(r, g, b);
        }
        var color = colors[str];
        if (color !== undefined) {
            return color;
        }
        throw new Error("unknown color: " + str);
    }
    exports.parseColor = parseColor;
    function toStringColor(color) {
        var a = color & 255;
        if (a === 255) {
            var str = (color >>> 8).toString(16);
            switch (str.length) {
                case 6: return "#" + str;
                case 5: return "#0" + str;
                case 4: return "#00" + str;
                case 3: return "#000" + str;
                case 2: return "#0000" + str;
                case 1: return "#00000" + str;
                case 0: return "#000000";
                default: throw new Error("this should not happen");
            }
        }
        var r = color >>> 24;
        var g = (color >>> 16) & 255;
        var b = (color >>> 8) & 255;
        var aFixed = (a / 255).toFixed(3);
        return "rgba(" + r + "," + g + "," + b + "," + aFixed + ")";
    }
    exports.toStringColor = toStringColor;
    function scaleColor(color, factor) {
        var r = ~~((color >>> 24) * factor);
        var g = ~~(((color >>> 16) & 255) * factor);
        var b = ~~(((color >>> 8) & 255) * factor);
        return makeColor(r, g, b, color & 255);
    }
    exports.scaleColor = scaleColor;
    function blendColors(c0, c1, t) {
        var c0r = c0 >>> 24;
        var c0g = (c0 >>> 16) & 255;
        var c0b = (c0 >>> 8) & 255;
        var c0a = c0 & 255;
        var c1r = c1 >>> 24;
        var c1g = (c1 >>> 16) & 255;
        var c1b = (c1 >>> 8) & 255;
        var c1a = c1 & 255;
        var r = ~~(t * c1r + (1 - t) * c0r);
        var g = ~~(t * c1g + (1 - t) * c0g);
        var b = ~~(t * c1b + (1 - t) * c0b);
        var a = ~~(t * c1a + (1 - t) * c0a);
        return makeColor(r, g, b, a);
    }
    exports.blendColors = blendColors;
});
define("direction", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dirDX = [0, 1, 1, 1, 0, -1, -1, -1];
    exports.dirDY = [-1, -1, 0, 1, 1, 1, 0, -1];
});
// TypeScript port of: https://github.com/pigulla/mersennetwister
define("mtrand", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A standalone, pure JavaScript implementation of the Mersenne Twister pseudo random number generator. Compatible
     * with Node.js, requirejs and browser environments. Packages are available for npm, Jam and Bower.
     *
     * @module MersenneTwister
     * @author Raphael Pigulla <pigulla@four66.com>
     * @license See the attached LICENSE file.
     * @version 0.2.3
     */
    /*
     * Most comments were stripped from the source. If needed you can still find them in the original C code:
     * http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/MT2002/CODES/mt19937ar.c
     *
     * The original port to JavaScript, on which this file is based, was done by Sean McCullough. It can be found at:
     * https://gist.github.com/banksean/300494
     */
    var MAX_INT = 4294967296.0;
    var N = 624;
    var M = 397;
    var UPPER_MASK = 0x80000000;
    var LOWER_MASK = 0x7fffffff;
    var MATRIX_A = 0x9908b0df;
    var MersenneTwister = /** @class */ (function () {
        /**
         * Instantiates a new Mersenne Twister.
         */
        function MersenneTwister(seed) {
            if (seed === void 0) { seed = new Date().getTime(); }
            this.mt = new Array(N);
            this.mti = N + 1;
            this.seed(seed);
        }
        /**
         * Initializes the state vector by using one unsigned 32-bit integer "seed", which may be zero.
         */
        MersenneTwister.prototype.seed = function (seed) {
            var s;
            this.mt[0] = seed >>> 0;
            for (this.mti = 1; this.mti < N; this.mti++) {
                s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
                this.mt[this.mti] =
                    (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253) + this.mti;
                this.mt[this.mti] >>>= 0;
            }
        };
        /**
         * Initializes the state vector by using an array key[] of unsigned 32-bit integers of the specified length. If
         * length is smaller than 624, then each array of 32-bit integers gives distinct initial state vector. This is
         * useful if you want a larger seed space than 32-bit word.
         */
        MersenneTwister.prototype.seedArray = function (vector) {
            var i = 1;
            var j = 0;
            var k = N > vector.length ? N : vector.length;
            var s;
            this.seed(19650218);
            for (; k > 0; k--) {
                s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
                this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525))) +
                    vector[j] + j;
                this.mt[i] >>>= 0;
                i++;
                j++;
                if (i >= N) {
                    this.mt[0] = this.mt[N - 1];
                    i = 1;
                }
                if (j >= vector.length) {
                    j = 0;
                }
            }
            for (k = N - 1; k; k--) {
                s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
                this.mt[i] =
                    (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941)) - i;
                this.mt[i] >>>= 0;
                i++;
                if (i >= N) {
                    this.mt[0] = this.mt[N - 1];
                    i = 1;
                }
            }
            this.mt[0] = 0x80000000;
        };
        /**
         * Generates a random unsigned 32-bit integer.
         */
        MersenneTwister.prototype.int = function () {
            var y;
            var kk;
            var mag01 = new Array(0, MATRIX_A);
            if (this.mti >= N) {
                if (this.mti === N + 1) {
                    this.seed(5489);
                }
                for (kk = 0; kk < N - M; kk++) {
                    y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
                    this.mt[kk] = this.mt[kk + M] ^ (y >>> 1) ^ mag01[y & 1];
                }
                for (; kk < N - 1; kk++) {
                    y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
                    this.mt[kk] = this.mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 1];
                }
                y = (this.mt[N - 1] & UPPER_MASK) | (this.mt[0] & LOWER_MASK);
                this.mt[N - 1] = this.mt[M - 1] ^ (y >>> 1) ^ mag01[y & 1];
                this.mti = 0;
            }
            y = this.mt[this.mti++];
            y ^= (y >>> 11);
            y ^= (y << 7) & 0x9d2c5680;
            y ^= (y << 15) & 0xefc60000;
            y ^= (y >>> 18);
            return y >>> 0;
        };
        /**
         * Generates a random unsigned 31-bit integer.
         */
        MersenneTwister.prototype.int31 = function () {
            return this.int() >>> 1;
        };
        /**
         * Generates a random real in the interval [0;1] with 32-bit resolution.
         */
        MersenneTwister.prototype.real = function () {
            return this.int() * (1.0 / (MAX_INT - 1));
        };
        /**
         * Generates a random real in the interval ]0;1[ with 32-bit resolution.
         */
        MersenneTwister.prototype.realx = function () {
            return (this.int() + 0.5) * (1.0 / MAX_INT);
        };
        /**
         * Generates a random real in the interval [0;1[ with 32-bit resolution.
         */
        MersenneTwister.prototype.rnd = function () {
            return this.int() * (1.0 / MAX_INT);
        };
        /**
         * Generates a random real in the interval [0;1[ with 53-bit resolution.
         */
        MersenneTwister.prototype.rndHiRes = function () {
            var a = this.int() >>> 5;
            var b = this.int() >>> 6;
            return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
        };
        /**
         * Generates a random integer in the interval [min;max[ with at most 32-bit resolution.
         */
        MersenneTwister.prototype.intRange = function (min, max) {
            return min + ~~(this.rnd() * (max - min));
        };
        return MersenneTwister;
    }());
    exports.MersenneTwister = MersenneTwister;
    var stdGen = new MersenneTwister();
    exports.stdGen = stdGen;
});
define("util", ["require", "exports", "mtrand"], function (require, exports, mtrand_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isMobileSafari() {
        return navigator.userAgent.match(/(iPod|iPhone|iPad)/) && navigator.userAgent.match(/AppleWebKit/);
    }
    exports.isMobileSafari = isMobileSafari;
    function isInteger(value) {
        return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
    }
    exports.isInteger = isInteger;
    function getObjectName(object) {
        var funcNameRegex = /function (.{1,})\(/;
        var results = (funcNameRegex).exec(object.constructor.toString());
        return (results && results.length > 1) ? results[1] : "";
    }
    exports.getObjectName = getObjectName;
    function toBoolean(parameter) {
        if (parameter) {
            return true;
        }
        return false;
    }
    exports.toBoolean = toBoolean;
    function valueOrDefault(val, def) {
        if (val === undefined) {
            return def;
        }
        return val;
    }
    exports.valueOrDefault = valueOrDefault;
    // only removes one value
    function removeFromArray(array, value) {
        var i = array.indexOf(value);
        if (i < 0) {
            return false;
        }
        array.splice(i, 1);
        return true;
    }
    exports.removeFromArray = removeFromArray;
    // Fisher-Yates
    function shuffleArray(array, count) {
        var currentIndex = count === undefined ? array.length : count;
        var temporaryValue;
        var randomIndex;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = ~~(mtrand_1.stdGen.rnd() * currentIndex);
            currentIndex -= 1;
            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
    }
    exports.shuffleArray = shuffleArray;
});
define("display", ["require", "exports", "color", "util"], function (require, exports, color_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function makeDisplay(canvas, fontImage, onDraw) {
        if (util_1.isMobileSafari()) {
            console.log("Prefering 2D canvas on iOS.");
            return makeCanvasDisplay(canvas, fontImage, onDraw);
        }
        var display = new GLCanvasDisplay(canvas, fontImage, onDraw);
        if (display.isValid()) {
            console.log("Creating WebGL display.");
            return display;
        }
        else {
            console.log("WebGL not supported!");
            return makeCanvasDisplay(canvas, fontImage, onDraw);
        }
    }
    exports.makeDisplay = makeDisplay;
    function makeCanvasDisplay(canvas, fontImage, onDraw) {
        console.log("Creating regular canvas display.");
        return new NormalCanvasDisplay(canvas, fontImage, onDraw);
    }
    exports.makeCanvasDisplay = makeCanvasDisplay;
    function makeNullDisplay() {
        return {
            charWidth: 0,
            charHeight: 0,
            width: 0,
            height: 0,
            char: [],
            fg: [],
            bg: [],
            reshape: function (force) { },
            redraw: function () { },
            destroy: function () { },
        };
    }
    exports.makeNullDisplay = makeNullDisplay;
    var BaseDisplay = /** @class */ (function () {
        function BaseDisplay(canvas, fontImage, onDraw) {
            this.canvas = canvas;
            this.fontImage = fontImage;
            this.onDraw = onDraw;
            this.count = 0;
            this.width = 0;
            this.height = 0;
            this.char = [0];
            this.fg = [color_1.colors.white];
            this.bg = [color_1.colors.black];
            this.wantRedraw = false;
            this.redrawScheduled = false;
            this.charWidth = ~~(fontImage.naturalWidth / 16);
            this.charHeight = ~~(fontImage.naturalHeight / 16);
        }
        BaseDisplay.prototype.redraw = function () {
            if (this.redrawScheduled) {
                this.wantRedraw = true;
            }
            else {
                this.scheduleRedraw();
            }
        };
        BaseDisplay.prototype.scheduleRedraw = function () {
            var _this = this;
            this.redrawScheduled = true;
            window.requestAnimationFrame(function () {
                _this.redrawScheduled = false;
                _this.draw();
                if (_this.wantRedraw) {
                    _this.wantRedraw = false;
                    _this.scheduleRedraw();
                }
            });
        };
        BaseDisplay.prototype.reshape = function (force) {
            var width = Math.ceil(window.innerWidth / this.charWidth);
            var height = Math.ceil(window.innerHeight / this.charHeight);
            if (!force && width === this.width && height === this.height) {
                return;
            }
            if (util_1.isInteger(window.devicePixelRatio)) {
                this.canvas.classList.add("pixelated-canvas");
            }
            else {
                this.canvas.classList.remove("pixelated-canvas");
            }
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.width = width;
            this.height = height;
            this.count = width * height;
            console.log("Reshaped display: " + width + " x " + height + " (" + this.canvas.width + " x " + this.canvas.height + ")");
            this.char.length = this.count;
            this.fg.length = this.count;
            this.bg.length = this.count;
            if (this.onReshaped) {
                this.onReshaped();
            }
            this.redraw();
        };
        return BaseDisplay;
    }());
    var VERTEX_SHADER_CODE = [
        "precision mediump float;",
        "attribute vec4 position;",
        "void main() {",
        "gl_Position = position;",
        "}",
    ].join("\n");
    var FRAGMENT_SHADER_CODE = [
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
    var GLCanvasDisplay = /** @class */ (function (_super) {
        __extends(GLCanvasDisplay, _super);
        function GLCanvasDisplay(canvas, fontImage, onDraw) {
            var _this = _super.call(this, canvas, fontImage, onDraw) || this;
            var onError = function (e) {
                console.log("Error creating WebGL context: " + e.statusMessage);
            };
            var onLost = function (e) {
                console.log("Lost WebGL context");
                _this.gl = undefined;
                e.preventDefault();
            };
            var onRestore = function (e) {
                console.log("Restoring WebGL context");
                _this.createContext();
            };
            _this.removeEventListeners = function () {
                canvas.removeEventListener("webglcontextcreationerror", onError);
                canvas.removeEventListener("webglcontextlost", onLost);
                canvas.removeEventListener("webglcontextrestored", onRestore);
            };
            canvas.addEventListener("webglcontextcreationerror", onError, false);
            canvas.addEventListener("webglcontextlost", onLost, false);
            canvas.addEventListener("webglcontextrestored", onRestore, false);
            _this.createContext();
            if (!_this.isValid()) {
                _this.removeEventListeners();
            }
            return _this;
        }
        GLCanvasDisplay.prototype.isValid = function () {
            return !!this.gl;
        };
        GLCanvasDisplay.prototype.destroy = function () {
            if (this.isValid()) {
                this.removeEventListeners();
                if (this.deleteGLHandles) {
                    this.deleteGLHandles();
                }
                this.gl = undefined;
            }
        };
        GLCanvasDisplay.prototype.draw = function () {
            var _a = this, count = _a.count, width = _a.width, height = _a.height, char = _a.char, fg = _a.fg, bg = _a.bg, gl = _a.gl, atlasBuffer = _a.atlasBuffer;
            if (!gl || !atlasBuffer) {
                return;
            }
            for (var i = 0; i < count; ++i) {
                char[i] = 0;
                fg[i] = color_1.colors.white;
                bg[i] = color_1.colors.black;
            }
            this.onDraw();
            for (var i = 0, off = 0; i < count; ++i, off += 4) {
                var fgc = fg[i];
                atlasBuffer[off + 0] = fgc >>> 24;
                atlasBuffer[off + 1] = (fgc >>> 16) & 255;
                atlasBuffer[off + 2] = (fgc >>> 8) & 255;
                atlasBuffer[off + 3] = fgc & 255;
            }
            for (var i = 0, off = count * 4; i < count; ++i, off += 4) {
                var bgc = bg[i];
                atlasBuffer[off + 0] = bgc >>> 24;
                atlasBuffer[off + 1] = (bgc >>> 16) & 255;
                atlasBuffer[off + 2] = (bgc >>> 8) & 255;
                atlasBuffer[off + 3] = char[i]; // we sneak char code along with background color
            }
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height * 2, gl.RGBA, gl.UNSIGNED_BYTE, atlasBuffer);
            checkGlError(gl, "texSubImage2D");
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            checkGlError(gl, "drawArrays");
        };
        GLCanvasDisplay.prototype.createContext = function () {
            var _this = this;
            var canvas = this.canvas;
            var gl = this.gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
            if (!gl) {
                return;
            }
            var vertexShader = compileShader(gl, VERTEX_SHADER_CODE, gl.VERTEX_SHADER);
            var fragmentShader = compileShader(gl, FRAGMENT_SHADER_CODE, gl.FRAGMENT_SHADER);
            var shaderProgram = createProgram(gl, vertexShader, fragmentShader);
            gl.useProgram(shaderProgram);
            var renderWidthUniform = gl.getUniformLocation(shaderProgram, "renderWidth");
            checkGlError(gl, "getUniformLocation");
            var renderHeightUniform = gl.getUniformLocation(shaderProgram, "renderHeight");
            checkGlError(gl, "getUniformLocation");
            var canvasHeightUniform = gl.getUniformLocation(shaderProgram, "canvasHeight");
            checkGlError(gl, "getUniformLocation");
            var charWidthUniform = gl.getUniformLocation(shaderProgram, "charWidth");
            checkGlError(gl, "getUniformLocation");
            var charHeightUniform = gl.getUniformLocation(shaderProgram, "charHeight");
            checkGlError(gl, "getUniformLocation");
            var fontTextureUniform = gl.getUniformLocation(shaderProgram, "fontTexture");
            checkGlError(gl, "getUniformLocation");
            var atlasTextureUniform = gl.getUniformLocation(shaderProgram, "atlasTexture");
            checkGlError(gl, "getUniformLocation");
            var vertexBuffer = gl.createBuffer();
            checkGlError(gl, "createBuffer");
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            checkGlError(gl, "bindBuffer");
            var vertexBufferArray = new Float32Array([
                -1, 1, 0, 1,
                -1, -1, 0, 1,
                1, 1, 0, 1,
                1, -1, 0, 1,
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, vertexBufferArray, gl.STATIC_DRAW);
            checkGlError(gl, "bufferData");
            var positionAttribute = gl.getAttribLocation(shaderProgram, "position");
            checkGlError(gl, "getAttribLocation");
            gl.enableVertexAttribArray(positionAttribute);
            checkGlError(gl, "enableVertexAttribArray");
            gl.vertexAttribPointer(positionAttribute, 4, gl.FLOAT, false, 0, 0);
            checkGlError(gl, "vertexAttribPointer");
            gl.activeTexture(gl.TEXTURE0);
            var fontTexture = this.fontTexture = makeTexture(gl);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.fontImage);
            checkGlError(gl, "texImage2D");
            gl.activeTexture(gl.TEXTURE1);
            var atlasTexture = this.atlasTexture = makeTexture(gl);
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
            this.deleteGLHandles = function () {
                gl.deleteProgram(shaderProgram);
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
                gl.deleteBuffer(vertexBuffer);
                gl.deleteTexture(fontTexture);
                gl.deleteTexture(atlasTexture);
                _this.fontTexture = undefined;
                _this.atlasTexture = undefined;
            };
            this.onReshaped = function () {
                if (!_this.isValid()) {
                    return;
                }
                _this.atlasBuffer = new Uint8Array(_this.width * _this.height * 4 * 2);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, _this.width, _this.height * 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, _this.atlasBuffer);
                checkGlError(gl, "texImage2D");
                gl.uniform1f(renderWidthUniform, _this.width * _this.charWidth);
                checkGlError(gl, "uniform1f");
                gl.uniform1f(renderHeightUniform, _this.height * _this.charHeight);
                checkGlError(gl, "uniform1f");
                gl.uniform1f(canvasHeightUniform, canvas.height);
                checkGlError(gl, "uniform1f");
                gl.viewport(0, 0, canvas.width, canvas.height);
                checkGlError(gl, "viewport");
            };
            this.reshape(true);
        };
        return GLCanvasDisplay;
    }(BaseDisplay));
    /**
     * Creates and compiles a shader.
     *
     * @param {!WebGLRenderingContext} gl The WebGL Context.
     * @param {string} shaderSource The GLSL source code for the shader.
     * @param {number} shaderType The type of shader, VERTEX_SHADER or
     *     FRAGMENT_SHADER.
     * @return {!WebGLShader} The shader.
     */
    function compileShader(gl, shaderSource, shaderType) {
        var shader = gl.createShader(shaderType);
        if (!shader) {
            throw new Error("error creating shader");
        }
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
    function createProgram(gl, vertexShader, fragmentShader) {
        var program = gl.createProgram();
        if (!program) {
            throw new Error("error creating program");
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!success) {
            throw new Error("program filed to link: " + gl.getProgramInfoLog(program));
        }
        return program;
    }
    /**
     * Throws an exception if the last operation caused an error.
     *
     * @param {!WebGLRenderingContext) gl The WebGL context.
     * @param {!string} Name of the last operation.
     */
    function checkGlError(gl, operation) {
        var error = gl.getError();
        if (error !== gl.NO_ERROR && error !== gl.CONTEXT_LOST_WEBGL) {
            var msg = "WebGL error (" + operation + "): " + error;
            console.log(msg);
            throw new Error(msg);
        }
    }
    function makeTexture(gl) {
        var texture = gl.createTexture();
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
    var NormalCanvasDisplay = /** @class */ (function (_super) {
        __extends(NormalCanvasDisplay, _super);
        function NormalCanvasDisplay(canvas, fontImage, onDraw) {
            var _this = _super.call(this, canvas, fontImage, onDraw) || this;
            _this.prevWidth = 0;
            _this.prevHeight = 0;
            _this.prevChar = [0];
            _this.prevFg = [color_1.colors.white];
            _this.prevBg = [color_1.colors.black];
            _this.dirty = [false];
            _this.allDirty = true;
            _this.onReshaped = function () {
                _this.dirty.length = _this.count;
                _this.allDirty = true;
                var context = _this.canvas.getContext("2d");
                if (!context) {
                    throw new Error("error getting context");
                }
                _this.context = context;
                var smooth = !util_1.isInteger(window.devicePixelRatio);
                context.imageSmoothingEnabled = smooth;
                context.mozImageSmoothingEnabled = smooth;
                context.webkitImageSmoothingEnabled = smooth;
                context.msImageSmoothingEnabled = smooth;
            };
            _this.reshape(true);
            return _this;
        }
        NormalCanvasDisplay.prototype.destroy = function () {
        };
        NormalCanvasDisplay.prototype.draw = function () {
            var black = color_1.colors.black, white = color_1.colors.white;
            var _a = this, count = _a.count, width = _a.width, height = _a.height, char = _a.char, fg = _a.fg, bg = _a.bg, prevWidth = _a.prevWidth, prevHeight = _a.prevHeight, prevChar = _a.prevChar, prevFg = _a.prevFg, prevBg = _a.prevBg, dirty = _a.dirty, allDirty = _a.allDirty, context = _a.context, charWidth = _a.charWidth, charHeight = _a.charHeight, fontImage = _a.fontImage;
            if (!context) {
                return;
            }
            char.length = count;
            fg.length = count;
            bg.length = count;
            for (var i = 0; i < count; ++i) {
                char[i] = 0;
                fg[i] = white;
                bg[i] = black;
            }
            this.onDraw();
            var dirtyCount = 0;
            var currFillColor = undefined;
            context.globalCompositeOperation = "source-over";
            for (var y = 0; y < height; ++y) {
                for (var x = 0; x < width; ++x) {
                    var i = y * width + x;
                    if (!allDirty) {
                        if (x < prevWidth && y < prevHeight) {
                            var j = y * prevWidth + x;
                            dirty[i] = char[i] !== prevChar[j] || fg[i] !== prevFg[j] || bg[i] !== prevBg[j];
                        }
                        else {
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
                    }
                    else {
                        if (currFillColor !== bg[i]) {
                            context.fillStyle = color_1.toStringColor(bg[i]);
                            currFillColor = bg[i];
                        }
                        context.fillRect(x * charWidth, y * charHeight, charWidth, charHeight);
                    }
                    if (char[i] === 0 || char[i] === 32) {
                        continue;
                    }
                    // draw the foreground characters (using a white font)
                    var sx = (char[i] % 16) * charWidth;
                    var sy = ~~(char[i] / 16) * charHeight;
                    context.drawImage(fontImage, sx, sy, charWidth, charHeight, x * charWidth, y * charHeight, charWidth, charHeight);
                }
            }
            // apply color onto non-white characters (this is why background must come last for these cells)
            context.globalCompositeOperation = "source-atop";
            for (var y = 0; y < height; ++y) {
                for (var x = 0; x < width; ++x) {
                    var i = y * width + x;
                    if (!allDirty && !dirty[i]) {
                        continue;
                    }
                    if (fg[i] === white || char[i] === 0 || char[i] === 32) {
                        continue; // white or invisible characters don't need to be colored
                    }
                    if (currFillColor !== fg[i]) {
                        context.fillStyle = color_1.toStringColor(fg[i]);
                        currFillColor = fg[i];
                    }
                    context.fillRect(x * charWidth, y * charHeight, charWidth, charHeight);
                }
            }
            // draw background underneath visible non-white characters
            context.globalCompositeOperation = "destination-over";
            for (var y = 0; y < height; ++y) {
                for (var x = 0; x < width; ++x) {
                    var i = y * width + x;
                    if (!allDirty && !dirty[i]) {
                        continue;
                    }
                    if (bg[i] === black || fg[i] === white || char[i] === 0 || char[i] === 32) {
                        continue; // black bg, white fg (or invisible) cells have already had their background drawn
                    }
                    if (currFillColor !== bg[i]) {
                        context.fillStyle = color_1.toStringColor(bg[i]);
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
        };
        return NormalCanvasDisplay;
    }(BaseDisplay));
});
// adapted from: http://www.roguebasin.com/index.php?title=Spiral_Path_FOV
define("fov", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MAX_RADIUS = 300;
    var TABLE_DIM = 2 * MAX_RADIUS;
    var QUEUE_LENGTH = 2 * TABLE_DIM;
    var MAX_ANGLE = ~~(1000000 * 2.0 * Math.PI);
    // lookup tables
    var minAngleTable = [0];
    var maxAngleTable = [0];
    var outerAngleTable = [0];
    var outerAngle2Table = [0];
    // reusable tables with state. zero-initialized, and returned to zero after use
    var minLitTable = [0];
    var maxLitTable = [0];
    // reusable queue arrays
    var queueX = [0];
    var queueY = [0];
    function calcTableIndex(x, y) {
        return (y + MAX_RADIUS) * TABLE_DIM + (x + MAX_RADIUS);
    }
    function toAngle(a) {
        var result = ~~(1000000 * a);
        while (result < 0) {
            result += MAX_ANGLE;
        }
        while (result > MAX_ANGLE) {
            result -= MAX_ANGLE;
        }
        return result;
    }
    (function () {
        queueX.length = QUEUE_LENGTH;
        queueY.length = QUEUE_LENGTH;
        minAngleTable.length = TABLE_DIM * TABLE_DIM;
        maxAngleTable.length = TABLE_DIM * TABLE_DIM;
        outerAngleTable.length = TABLE_DIM * TABLE_DIM;
        outerAngle2Table.length = TABLE_DIM * TABLE_DIM;
        minLitTable.length = TABLE_DIM * TABLE_DIM;
        maxLitTable.length = TABLE_DIM * TABLE_DIM;
        for (var y = -MAX_RADIUS; y < MAX_RADIUS; ++y) {
            for (var x = -MAX_RADIUS; x < MAX_RADIUS; ++x) {
                var tableIndex = (y + MAX_RADIUS) * TABLE_DIM + (x + MAX_RADIUS);
                minAngleTable[tableIndex] = toAngle(calcMinAngle(x, y));
                maxAngleTable[tableIndex] = toAngle(calcMaxAngle(x, y));
                outerAngleTable[tableIndex] = toAngle(calcOuterAngle(x, y));
                outerAngle2Table[tableIndex] = toAngle(calcOuterAngle2(x, y));
                minLitTable[tableIndex] = 0;
                maxLitTable[tableIndex] = 0;
            }
        }
        /** The minimum angle of the tile; that is, the angle of the smallest - angled corner. */
        function calcMinAngle(x, y) {
            if (x === 0 && y === 0) {
                return 0.0; // origin special case
            }
            if (x >= 0 && y > 0) {
                return coordAngle(x + 1, y); // first quadrant
            }
            if (x < 0 && y >= 0) {
                return coordAngle(x + 1, y + 1); // second quadrant
            }
            if (x <= 0 && y < 0) {
                return coordAngle(x, y + 1); // third quadrant
            }
            return coordAngle(x, y); // fourth quadrant
        }
        /** The maximum angle of the tile; that is, the angle of the largest-angled corner. */
        function calcMaxAngle(x, y) {
            if (x === 0 && y === 0) {
                return 2.0 * Math.PI; // origin special case
            }
            if (x > 0 && y >= 0) {
                return coordAngle(x, y + 1); // first quadrant
            }
            if (x <= 0 && y > 0) {
                return coordAngle(x, y); // second quadrant
            }
            if (x < 0 && y <= 0) {
                return coordAngle(x + 1, y); // third quadrant
            }
            return coordAngle(x + 1, y + 1); // fourth quadrant
        }
        /** The angle of the outer corner of each tile: On the origin lines, the angle of the FIRST outer corner. */
        function calcOuterAngle(x, y) {
            if (x === 0 && y === 0) {
                return 0.0; // origin special case
            }
            if (x >= 0 && y > 0) {
                return coordAngle(x + 1, y + 1); // first quadrant with positive y axis
            }
            if (x < 0 && y >= 0) {
                return coordAngle(x, y + 1); // second quadrant with negative x axis
            }
            if (x <= 0 && y < 0) {
                return coordAngle(x, y); // third quadrant with negative y axis
            }
            return coordAngle(x + 1, y); // fourth quadrant with positive x axis
        }
        /**
         * The squares on the axes (x or y == 0) have a second outer corner.
         * This function identifies the angle from the center of the origin
         * square to that corner.
         */
        function calcOuterAngle2(x, y) {
            if (x !== 0 && y !== 0) {
                return 0.0; // meaningless on non-axis squares
            }
            if (x > 0) {
                return coordAngle(x + 1, y + 1);
            }
            if (x < 0) {
                return coordAngle(x, y);
            }
            if (y > 0) {
                return coordAngle(x, y + 1);
            }
            if (y < 0) {
                return coordAngle(x + 1, y);
            }
            return 0.0; // meaningless on origin
        }
        /**
         * Returns the angle that "oughta" be in the geometry grid for given
         * coordinates, if the grid went to those coordinates.
         */
        function coordAngle(x, y) {
            return Math.atan2(y - 0.5, x - 0.5);
        }
    })();
    function spiralPathFOV(originX, originY, radius, visit, blocked, arcStart, arcEnd) {
        if (arcStart === void 0) { arcStart = 0.0; }
        if (arcEnd === void 0) { arcEnd = 2.0 * Math.PI; }
        if (radius >= MAX_RADIUS) {
            throw new Error("fov radius too large: " + radius);
        }
        arcStart = toAngle(arcStart);
        arcEnd = toAngle(arcEnd);
        var queueHead = 0;
        var queueTail = 0;
        // the point of origin is always marked by the traverse.
        visit(originX, originY);
        // these 4 squares (in this order) are a valid "starting set" for Spiralpath traversal.
        // A valid starting set is either a clockwise or counterclockwise traversal of all
        // the points with manhattan distance 1 from the origin.
        testMark(1, 0, arcStart, arcEnd, minAngleTable[calcTableIndex(1, 0)], maxAngleTable[calcTableIndex(1, 0)]);
        testMark(0, 1, arcStart, arcEnd, minAngleTable[calcTableIndex(0, 1)], maxAngleTable[calcTableIndex(0, 1)]);
        testMark(-1, 0, arcStart, arcEnd, minAngleTable[calcTableIndex(-1, 0)], maxAngleTable[calcTableIndex(-1, 0)]);
        testMark(0, -1, arcStart, arcEnd, minAngleTable[calcTableIndex(0, -1)], maxAngleTable[calcTableIndex(0, -1)]);
        while (queueHead !== queueTail) {
            // we dequeue one item and set all the particulars.  Also, we set the
            // squarelighting to zero for that tile so we know it's off the queue
            // next time we come across it.
            var curX = queueX[queueHead];
            var curY = queueY[queueHead];
            queueHead = (queueHead + 1) % QUEUE_LENGTH;
            var tableIndex = (curY + MAX_RADIUS) * TABLE_DIM + (curX + MAX_RADIUS);
            var minAngle = minAngleTable[tableIndex];
            var outerAngle = outerAngleTable[tableIndex];
            var outerAngle2 = outerAngle2Table[tableIndex];
            var maxAngle = maxAngleTable[tableIndex];
            var minLitAngle = minLitTable[tableIndex];
            var maxLitAngle = maxLitTable[tableIndex];
            minLitTable[tableIndex] = 0;
            maxLitTable[tableIndex] = 0;
            if (curX * curX + curY * curY < radius * radius) {
                if (arcStart > arcEnd) {
                    // arc includes anomaly line
                    if (minAngle >= arcStart && maxAngle >= arcStart && minAngle <= arcEnd && maxAngle <= arcEnd) {
                        continue;
                    }
                }
                else {
                    // arc does not include anomaly line
                    if (maxAngle <= arcStart && minAngle >= arcEnd) {
                        continue;
                    }
                }
                visit(originX + curX, originY + curY);
                if (!blocked(originX + curX, originY + curY)) {
                    var child1X = 0;
                    var child1Y = 0;
                    if (curX === 0 && curY === 0) {
                        child1X = curX;
                        child1Y = curY; // origin
                    }
                    else if (curX >= 0 && curY > 0) {
                        child1X = curX + 1;
                        child1Y = curY; // quadrant 1
                    }
                    else if (curX < 0 && curY >= 0) {
                        child1X = curX;
                        child1Y = curY + 1; // quadrant 2
                    }
                    else if (curX <= 0 && curY < 0) {
                        child1X = curX - 1;
                        child1Y = curY; // quadrant 3
                    }
                    else {
                        child1X = curX;
                        child1Y = curY - 1; // quadrant 4
                    }
                    var child2X = 0;
                    var child2Y = 0;
                    if (curX === 0 && curY === 0) {
                        child2X = curX;
                        child2Y = curY; // origin
                    }
                    else if (curX >= 0 && curY > 0) {
                        child2X = curX;
                        child2Y = curY + 1; // quadrant 1
                    }
                    else if (curX < 0 && curY >= 0) {
                        child2X = curX - 1;
                        child2Y = curY; // quadrant 2
                    }
                    else if (curX <= 0 && curY < 0) {
                        child2X = curX;
                        child2Y = curY - 1; // quadrant 3
                    }
                    else {
                        child2X = curX + 1;
                        child2Y = curY; // quadrant 4
                    }
                    testMark(child1X, child1Y, minLitAngle, maxLitAngle, minAngle, outerAngle);
                    if (outerAngle2 !== 0.0) {
                        testMark(child2X, child2Y, minLitAngle, maxLitAngle, outerAngle, outerAngle2);
                        var child3X = 0;
                        var child3Y = 0;
                        if (curX !== 0 && curY !== 0) {
                            child3X = child3Y = 0; // non-axis
                        }
                        else if (curX > 0) {
                            child3X = curX;
                            child3Y = curY + 1;
                        }
                        else if (curX < 0) {
                            child3X = curX;
                            child3Y = curY - 1;
                        }
                        else if (curY > 0) {
                            child3X = curX - 1;
                            child3Y = curY;
                        }
                        else if (curY < 0) {
                            child3X = curX + 1;
                            child3Y = curY;
                        }
                        else {
                            child3X = child3Y = 0; // origin
                        }
                        testMark(child3X, child3Y, minLitAngle, maxLitAngle, outerAngle2, maxAngle);
                    }
                    else {
                        testMark(child2X, child2Y, minLitAngle, maxLitAngle, outerAngle, maxAngle);
                    }
                }
                else if (minLitAngle === minAngle) {
                    var child1X = 0;
                    var child1Y = 0;
                    if (curX === 0 && curY === 0) {
                        child1X = curX;
                        child1Y = curY; // origin
                    }
                    else if (curX >= 0 && curY > 0) {
                        child1X = curX + 1;
                        child1Y = curY; // quadrant 1
                    }
                    else if (curX < 0 && curY >= 0) {
                        child1X = curX;
                        child1Y = curY + 1; // quadrant 2
                    }
                    else if (curX <= 0 && curY < 0) {
                        child1X = curX - 1;
                        child1Y = curY; // quadrant 3
                    }
                    else {
                        child1X = curX;
                        child1Y = curY - 1; // quadrant 4
                    }
                    // cell is opaque.  We pass an infinitely-narrow ray of
                    // light from its first corner to its first child if we
                    // are doing corner touchup.
                    mark(child1X, child1Y, minAngle, minAngle);
                }
            }
        }
        /** This adds light to a tile. Also, if a tile is not in the queue, it enqueues it. */
        function mark(x, y, min, max) {
            var tableIndex = (y + MAX_RADIUS) * TABLE_DIM + (x + MAX_RADIUS);
            var minLit = minLitTable[tableIndex];
            var maxLit = maxLitTable[tableIndex];
            if (minLit === 0 && maxLit === 0) {
                // no light -- implies not in queue, so we add it to the queue.
                queueX[queueTail] = x;
                queueY[queueTail] = y;
                queueTail = (queueTail + 1) % QUEUE_LENGTH;
                minLitTable[tableIndex] = min;
                maxLitTable[tableIndex] = max;
            }
            else {
                if (min < minLit) {
                    minLitTable[tableIndex] = min;
                }
                if (max > maxLit) {
                    maxLitTable[tableIndex] = max;
                }
            }
        }
        /**
         * The total lit angle is represented by minLitAngle, maxLitAngle.
         * minAngle and maxAngle are the minimum and maximum that can be illuminated in this operation.
         * Our task is to test and see if we can add light to the tile.
         * If any light is added, we call mark.
         */
        function testMark(x, y, minLitAngle, maxLitAngle, minAngle, maxAngle) {
            if (minLitAngle > maxLitAngle) {
                // we're passing light along the anomaly axis. This takes
                // advantage of the grid-geometric property that no
                // less-than-total obstructions are possible.
                mark(x, y, minAngle, maxAngle);
            }
            else if (maxAngle < minLitAngle || minAngle > maxLitAngle) {
                // lightable area is outside the lighting.
            }
            else if (minAngle <= minLitAngle && maxLitAngle <= maxAngle) {
                // lightable area contains the lighting.
                mark(x, y, minLitAngle, maxLitAngle);
            }
            else if (minAngle >= minLitAngle && maxLitAngle >= maxAngle) {
                // lightable area contained by the lighting.
                mark(x, y, minAngle, maxAngle);
            }
            else if (minAngle >= minLitAngle && maxLitAngle <= maxAngle) {
                // least of lightable area overlaps greatest of lighting.
                mark(x, y, minAngle, maxLitAngle);
            }
            else if (minAngle <= minLitAngle && maxLitAngle >= maxAngle) {
                // greatest of lightable area overlaps least of lighting.
                mark(x, y, minLitAngle, maxAngle);
            }
            else { // This never happens.
                throw new Error("unexpected"); // unhandled case, not on the anomaly line.
            }
        }
    }
    exports.fieldOfView = spiralPathFOV;
});
define("math", ["require", "exports", "direction"], function (require, exports, direction_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Vec2 = /** @class */ (function () {
        function Vec2(x, y) {
            this.x = x;
            this.y = y;
        }
        Vec2.prototype.equals = function (p) {
            if (!p) {
                return false;
            }
            return this.x === p.x && this.y === p.y;
        };
        Vec2.prototype.distanceTo = function (p) {
            var dx = this.x - p.x;
            var dy = this.y - p.y;
            return Math.sqrt(dx * dx + dy * dy);
        };
        Vec2.prototype.mag = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        };
        Object.defineProperty(Vec2.prototype, "direction", {
            get: function () {
                var dx = signum(this.x);
                var dy = signum(this.y);
                for (var i = 0; i < 8; ++i) {
                    if (direction_1.dirDX[i] === dx && direction_1.dirDY[i] === dy) {
                        var dir = i;
                        return dir;
                    }
                }
                return undefined;
            },
            enumerable: true,
            configurable: true
        });
        Vec2.prototype.sub = function (p) {
            return new Vec2(this.x - p.x, this.y - p.y);
        };
        Vec2.prototype.add = function (p) {
            return new Vec2(this.x + p.x, this.y + p.y);
        };
        Vec2.prototype.toString = function () {
            return "Vec2(" + this.x + ", " + this.y + ")";
        };
        return Vec2;
    }());
    exports.Vec2 = Vec2;
    var Rect = /** @class */ (function () {
        function Rect(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        Object.defineProperty(Rect.prototype, "x1", {
            get: function () {
                return this.x + this.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rect.prototype, "y1", {
            get: function () {
                return this.y + this.height;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rect.prototype, "pos", {
            get: function () {
                return new Vec2(this.x, this.y);
            },
            enumerable: true,
            configurable: true
        });
        Rect.prototype.intersects = function (r) {
            return !(r.x > this.x1 ||
                r.x1 < this.x ||
                r.y > this.y1 ||
                r.y1 < this.y);
        };
        return Rect;
    }());
    exports.Rect = Rect;
    function signum(num) {
        return num ? num < 0 ? -1 : 1 : 0;
    }
    exports.signum = signum;
    function interpolate(a, b, t) {
        return a * (1 - t) + b * t;
    }
    exports.interpolate = interpolate;
});
define("pathfind", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var BinaryHeap = /** @class */ (function () {
        function BinaryHeap(isValueLess, setIndex) {
            var _this = this;
            this.heap = [];
            // tslint:disable-next-line:no-invalid-this
            this.isLess = function (i, j) { return isValueLess(_this.heap[i], _this.heap[j]); };
            this.setIndex = setIndex || function () { };
        }
        Object.defineProperty(BinaryHeap.prototype, "count", {
            get: function () {
                return this.heap.length;
            },
            enumerable: true,
            configurable: true
        });
        BinaryHeap.prototype.push = function (value) {
            var i = this.heap.length;
            this.setIndex(value, i);
            this.heap.push(value);
            this.swapUpward(i);
        };
        BinaryHeap.prototype.pop = function () {
            var top = this.heap[0];
            this.setIndex(top, -1);
            var last = this.heap.pop();
            if (last === undefined) {
                throw new Error("popped from empty heap");
            }
            if (this.heap.length > 0) {
                this.heap[0] = last;
                this.setIndex(last, 0);
                this.swapDownward(0);
            }
            return top;
        };
        BinaryHeap.prototype.swapUpward = function (i) {
            while (i > 0) {
                var parent_1 = ~~((i - 1) / 2);
                if (!this.isLess(i, parent_1)) {
                    break;
                }
                this.swap(i, parent_1);
                i = parent_1;
            }
        };
        BinaryHeap.prototype.swapDownward = function (i) {
            while (true) {
                var child1 = (i * 2) + 1;
                var child2 = (i * 2) + 2;
                if (child1 < this.heap.length && this.isLess(child1, i)) {
                    if (child2 < this.heap.length && this.isLess(child2, child1)) {
                        this.swap(i, child2);
                        i = child2;
                    }
                    else {
                        this.swap(i, child1);
                        i = child1;
                    }
                }
                else if (child2 < this.heap.length && this.isLess(child2, i)) {
                    this.swap(i, child2);
                    i = child2;
                }
                else {
                    break;
                }
            }
        };
        BinaryHeap.prototype.swap = function (i, j) {
            var temp = this.heap[i];
            this.heap[i] = this.heap[j];
            this.heap[j] = temp;
            this.setIndex(this.heap[i], i);
            this.setIndex(this.heap[j], j);
        };
        return BinaryHeap;
    }());
    // construct a path from node "start" to node "curr",
    // given an array "parents" which contains the node from which each node was reached during the search
    function constructPath(start, curr, parents) {
        var result = [];
        while (true) {
            result.push(curr);
            if (curr === start) {
                break;
            }
            curr = parents[curr];
        }
        result.reverse();
        return result;
    }
    function findPath(nodeCount, start, goal, calcDistance, expandNode) {
        // setup the arrays
        var states = [0 /* Virgin */];
        var heuristics = [Number.MAX_VALUE];
        var costs = [Number.MAX_VALUE];
        var parents = [-1]; // from which node did we reach each node
        var heapIndexes = [-1]; // index of each node in the binary heap
        for (var i = 1; i < nodeCount; ++i) {
            states.push(0 /* Virgin */);
            heuristics.push(Number.MAX_VALUE);
            costs.push(Number.MAX_VALUE);
            parents.push(-1);
            heapIndexes.push(-1);
        }
        // create a binary heap which we will use to find the
        // unvisited node with the shortest distance from start
        var heap = new BinaryHeap(function (a, b) { return costs[a] + heuristics[a] < costs[b] + heuristics[b]; }, function (n, i) { return heapIndexes[n] = i; });
        var neighbours = [0, 0, 0, 0, 0, 0, 0, 0];
        states[start] = 1 /* Open */;
        heuristics[start] = calcDistance(start, goal);
        costs[start] = 0;
        heap.push(start);
        while (heap.count > 0) {
            var curr = heap.pop();
            if (curr === goal) {
                return constructPath(start, curr, parents);
            }
            states[curr] = 2 /* Closed */;
            var count = expandNode(curr, neighbours);
            for (var i = 0; i < count; ++i) {
                var next = neighbours[i];
                if (states[next] === 2 /* Closed */) {
                    continue;
                }
                var cost = costs[curr] + calcDistance(curr, next);
                if (states[next] === 1 /* Open */) {
                    // we've seen this node before, so we must check if this path to it was shorter
                    if (cost < costs[next]) {
                        costs[next] = cost;
                        parents[next] = curr;
                        heap.swapUpward(heapIndexes[next]);
                    }
                }
                else {
                    // state is NodeState.Virgin
                    states[next] = 1 /* Open */;
                    heuristics[next] = calcDistance(next, goal);
                    costs[next] = cost;
                    parents[next] = curr;
                    heap.push(next);
                }
            }
        }
        return undefined;
    }
    exports.findPath = findPath;
    // create a function which calculates the neighbours of a given node, in a grid.
    // "node" is a 1D index into an array of size "width" x "height" representing the 2D grid
    function makeGridNodeExpander(eightDirections, width, height, isWalkable) {
        // coordinate deltas for children in all 8 or 4 directions, starting north going clockwise
        var diffX = eightDirections ? [0, 1, 1, 1, 0, -1, -1, -1] : [0, 1, 0, -1];
        var diffY = eightDirections ? [-1, -1, 0, 1, 1, 1, 0, -1] : [-1, 0, 1, 0];
        return function (node, result) {
            var nodeX = node % width;
            var nodeY = ~~(node / width);
            var resultCount = 0;
            for (var i = 0; i < diffX.length; ++i) {
                var x = nodeX + diffX[i];
                var y = nodeY + diffY[i];
                if (x >= 0 && y >= 0 && x < width && y < height && isWalkable(x, y)) {
                    result[resultCount++] = y * width + x;
                }
            }
            return resultCount;
        };
    }
    exports.makeGridNodeExpander = makeGridNodeExpander;
});
define("map", ["require", "exports", "math", "direction", "pathfind", "util", "mtrand"], function (require, exports, math_1, direction_2, pathfind_1, util_2, mtrand_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var areaPositionsByDistance = [];
    var areaPositionBuckets = [];
    var maxAreaRadius = 32;
    var Map = /** @class */ (function () {
        function Map(width, height) {
            var _this = this;
            this.width = width;
            this.height = height;
            this.flags = [0];
            this.altitude = [0];
            this.isWalkable = function (x, y) {
                if (x < 0 || y < 0 || x >= _this.width || y >= _this.height) {
                    return false;
                }
                return (_this.flags[y * _this.width + x] & 1 /* Walkable */) !== 0;
            };
            this.calcDistance = function (a, b) {
                var ax = a % _this.width;
                var ay = ~~(a / _this.width);
                var bx = b % _this.width;
                var by = ~~(b / _this.width);
                var deltaX = bx - ax;
                var deltaY = by - ay;
                return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            };
            this.cellCount = width * height;
            this.flags.length = this.cellCount;
            this.altitude.length = this.cellCount;
            for (var i = 0; i < this.cellCount; ++i) {
                this.flags[i] = 0;
                this.altitude[i] = 0;
            }
            this.expandNode = pathfind_1.makeGridNodeExpander(false, width, height, this.isWalkable);
        }
        Map.prototype.getCell = function (x, y) {
            var i = y * this.width + x;
            return {
                flags: this.flags[i],
                altitude: this.altitude[i],
            };
        };
        Map.prototype.setCell = function (x, y, cell) {
            var i = y * this.width + x;
            this.flags[i] = cell.flags;
            this.altitude[i] = cell.altitude;
        };
        Map.prototype.getFlags = function (x, y) {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                return 0;
            }
            return this.flags[y * this.width + x];
        };
        Map.prototype.setFlags = function (x, y, f) {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                return;
            }
            this.flags[y * this.width + x] = f;
        };
        Map.prototype.isFlagSet = function (x, y, f) {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                return false;
            }
            return (this.flags[y * this.width + x] & f) !== 0;
        };
        Map.prototype.setFlag = function (x, y, f) {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                return;
            }
            this.flags[y * this.width + x] |= f;
        };
        Map.prototype.clearFlag = function (x, y, f) {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                return;
            }
            this.flags[y * this.width + x] &= ~f;
        };
        Map.prototype.isWall = function (x, y) {
            if ((this.flags[y * this.width + x] & 1 /* Walkable */) === 0) {
                for (var dir = 0; dir < 8; ++dir) {
                    var nx = x + direction_2.dirDX[dir];
                    var ny = y + direction_2.dirDY[dir];
                    if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) {
                        continue;
                    }
                    if ((this.flags[ny * this.width + nx] & 1 /* Walkable */) !== 0) {
                        return true;
                    }
                }
            }
            return false;
        };
        Map.prototype.resetVisible = function () {
            for (var i = 0; i < this.cellCount; ++i) {
                this.flags[i] &= ~2 /* Visible */;
            }
        };
        Map.prototype.forNeighbours = function (originX, originY, radius, func) {
            if (radius > maxAreaRadius) {
                throw "too big radius";
            }
            for (var i = 0; i < areaPositionsByDistance.length; ++i) {
                var pos = areaPositionsByDistance[i];
                if (pos.distance > radius) {
                    return;
                }
                var x = pos.x + originX;
                var y = pos.y + originY;
                if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                    continue;
                }
                if (!func(x, y)) {
                    return;
                }
            }
        };
        Map.prototype.forNeighboursUnbiased = function (originX, originY, radius, func) {
            if (radius > maxAreaRadius) {
                throw "too big radius";
            }
            for (var i = 0; i < areaPositionBuckets.length; ++i) {
                var bucket = areaPositionBuckets[i];
                util_2.shuffleArray(bucket);
                for (var j = 0; j < bucket.length; ++j) {
                    var pos = bucket[j];
                    if (pos.distance > radius) {
                        return;
                    }
                    var x = pos.x + originX;
                    var y = pos.y + originY;
                    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                        continue;
                    }
                    if (!func(x, y)) {
                        return;
                    }
                }
            }
        };
        Map.prototype.calcPath = function (start, goal) {
            var startIndex = start.y * this.width + start.x;
            var goalIndex = goal.y * this.width + goal.x;
            var pathIndexes = pathfind_1.findPath(this.cellCount, startIndex, goalIndex, this.calcDistance, this.expandNode);
            if (pathIndexes === undefined) {
                return undefined;
            }
            var path = [];
            for (var i = 0; i < pathIndexes.length; ++i) {
                var index = pathIndexes[i];
                var x = index % this.width;
                var y = ~~(index / this.width);
                path.push(new math_1.Vec2(x, y));
            }
            return path;
        };
        Map.prototype.randomPos = function () {
            var x = ~~(this.width * mtrand_2.stdGen.rnd());
            var y = ~~(this.height * mtrand_2.stdGen.rnd());
            return new math_1.Vec2(x, y);
        };
        Map.prototype.randomWalkablePos = function () {
            for (var tries = 0; tries < 1000; ++tries) {
                var x = ~~(this.width * mtrand_2.stdGen.rnd());
                var y = ~~(this.height * mtrand_2.stdGen.rnd());
                if (this.isWalkable(x, y)) {
                    return new math_1.Vec2(x, y);
                }
            }
            return undefined;
        };
        return Map;
    }());
    exports.Map = Map;
    function makeUndoContext(map, ox, oy, width, height) {
        var begun = false;
        var ended = false;
        var flagsOrig = [0];
        var flagsDirty = [false];
        flagsOrig.length = width * height;
        flagsDirty.length = width * height;
        function beginRecording() {
            if (begun) {
                throw new Error("beginRecording() called twice");
            }
            begun = true;
            for (var y = 0; y < height; ++y) {
                for (var x = 0; x < width; ++x) {
                    var i = y * width + x;
                    flagsOrig[i] = map.getFlags(ox + x, oy + y);
                }
            }
        }
        function endRecording() {
            if (!begun) {
                throw new Error("endRecording() called before beginRecording()");
            }
            if (ended) {
                throw new Error("endRecording() called twice");
            }
            ended = true;
            for (var y = 0; y < height; ++y) {
                for (var x = 0; x < width; ++x) {
                    var i = y * width + x;
                    flagsDirty[i] = flagsOrig[i] !== map.getFlags(ox + x, oy + y);
                }
            }
        }
        function undo() {
            if (!ended) {
                throw new Error("undo() called before endRecording()");
            }
            for (var y = 0; y < height; ++y) {
                for (var x = 0; x < width; ++x) {
                    var i = y * width + x;
                    if (flagsDirty[i]) {
                        map.setFlags(ox + x, oy + y, flagsOrig[i]);
                    }
                }
            }
        }
        return {
            beginRecording: beginRecording,
            endRecording: endRecording,
            undo: undo,
        };
    }
    exports.makeUndoContext = makeUndoContext;
    function makeUndoStack(map) {
        var stack = [];
        function pushContext(ox, oy, width, height) {
            var context = makeUndoContext(map, ox, oy, width, height);
            stack.push(context);
            return context;
        }
        function popContext() {
            var ctx = stack.pop();
            if (!ctx) {
                throw new Error("popped from empty stack");
            }
            ctx.undo();
        }
        function popAll() {
            while (stack.length > 0) {
                var ctx = stack.pop();
                if (!ctx) {
                    throw new Error("popped from empty stack");
                }
                ctx.undo();
            }
        }
        return {
            pushContext: pushContext,
            popContext: popContext,
            popAll: popAll,
        };
    }
    exports.makeUndoStack = makeUndoStack;
    {
        for (var y = -maxAreaRadius; y <= maxAreaRadius; ++y) {
            for (var x = -maxAreaRadius; x <= maxAreaRadius; ++x) {
                var cx = x + 0.5;
                var cy = y + 0.5;
                areaPositionsByDistance.push({
                    x: x,
                    y: y,
                    distance: Math.sqrt(cx * cx + cy * cy),
                });
            }
        }
        areaPositionsByDistance.sort(function (a, b) {
            return a.distance - b.distance;
        });
        var currDistance = -1;
        var currBucket = undefined;
        for (var i = 0; i < areaPositionsByDistance.length; ++i) {
            var pos = areaPositionsByDistance[i];
            var d = ~~(pos.distance);
            if (d !== currDistance) {
                if (currBucket !== undefined) {
                    areaPositionBuckets.push(currBucket);
                }
                currBucket = [];
                currDistance = d;
            }
            if (currBucket === undefined) {
                throw new Error("should not happen");
            }
            currBucket.push(pos);
        }
        if (currBucket !== undefined && currBucket.length > 0) {
            areaPositionBuckets.push(currBucket);
        }
    }
});
define("entity/entity", ["require", "exports", "math", "direction"], function (require, exports, math_2, direction_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var entityCounter = 0;
    var entityIdFreelist = [];
    var entityFlags = [];
    var entityX = [];
    var entityY = [];
    var entityMap = [];
    var Entity = /** @class */ (function () {
        function Entity(id) {
            if (id === void 0) { id = makeEntity(); }
            this.id = id;
            if (id >= entityFlags.length) {
                throw new Error("bad entity id");
            }
            if ((entityFlags[id] & 1 /* Alive */) === 0) {
                throw new Error("entity is not alive");
            }
        }
        Entity.prototype.free = function () {
            freeEntity(this.id);
        };
        Entity.prototype.move = function (dir) {
            moveEntity(this.id, dir);
        };
        Object.defineProperty(Entity.prototype, "x", {
            get: function () {
                return entityX[this.id];
            },
            set: function (val) {
                entityX[this.id] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "y", {
            get: function () {
                return entityY[this.id];
            },
            set: function (val) {
                entityY[this.id] = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "position", {
            get: function () {
                return new math_2.Vec2(entityX[this.id], entityY[this.id]);
            },
            set: function (pos) {
                entityX[this.id] = pos.x;
                entityY[this.id] = pos.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Entity.prototype, "map", {
            get: function () {
                return entityMap[this.id];
            },
            set: function (map) {
                entityMap[this.id] = map;
            },
            enumerable: true,
            configurable: true
        });
        return Entity;
    }());
    exports.Entity = Entity;
    function makeEntity(flags) {
        if (flags === void 0) { flags = 0; }
        var id;
        if (entityIdFreelist.length > 0) {
            id = entityIdFreelist.pop() || entityCounter++;
        }
        else {
            id = entityCounter++;
        }
        entityFlags[id] = flags | 1 /* Alive */;
        entityX[id] = 0;
        entityY[id] = 0;
        return id;
    }
    exports.makeEntity = makeEntity;
    function freeEntity(id) {
        if (id >= entityFlags.length) {
            throw new Error("bad entity id");
        }
        if ((entityFlags[id] & 1 /* Alive */) === 0) {
            throw new Error("entity is not alive");
        }
        if ((entityFlags[id] & 2 /* Immortal */) !== 0) {
            throw new Error("can't free immortal entity");
        }
        entityIdFreelist.push(id);
        entityFlags[id] = 0;
    }
    exports.freeEntity = freeEntity;
    function moveEntity(id, dir) {
        var map = entityMap[id];
        if (!map) {
            throw new Error("entity is not on a map");
        }
        var x = entityX[id];
        var y = entityY[id];
        var newX = x + direction_3.dirDX[dir];
        var newY = y + direction_3.dirDY[dir];
        if (!map.isWalkable(newX, newY)) {
            return;
        }
        entityX[id] = newX;
        entityY[id] = newY;
    }
    exports.moveEntity = moveEntity;
});
define("entity/player", ["require", "exports", "entity/entity"], function (require, exports, entity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Player = /** @class */ (function (_super) {
        __extends(Player, _super);
        function Player() {
            return _super.call(this) || this;
        }
        return Player;
    }(entity_1.Entity));
    exports.Player = Player;
    var player = new Player();
    exports.player = player;
});
define("mapdrawer", ["require", "exports", "color", "fov", "entity/player"], function (require, exports, color_2, fov_1, player_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function drawMap(map, display, corner, cursorPos) {
        var width = display.width, height = display.height, char = display.char, fg = display.fg, bg = display.bg;
        var wallColor = color_2.makeColor(244, 164, 96);
        var soilColor = color_2.makeColor(64, 64, 64);
        for (var y = 0; y < height; ++y) {
            for (var x = 0; x < width; ++x) {
                var cellX = x + corner.x;
                var cellY = y + corner.y;
                if (cellX < 0 || cellY < 0 || cellX >= map.width || cellY >= map.height) {
                    continue;
                }
                var flags = map.getFlags(cellX, cellY);
                if ((flags & 4 /* Discovered */) === 0) {
                    continue;
                }
                var charCode = 250; // centered dot
                var bgColor = color_2.colors.black;
                var fgColor = color_2.colors.white;
                if ((flags & 1 /* Walkable */) === 0) {
                    if (map.isWall(cellX, cellY)) {
                        charCode = 176;
                        fgColor = wallColor;
                    }
                    else {
                        charCode = 247;
                        fgColor = soilColor;
                    }
                }
                if ((flags & 8 /* Water */) !== 0) {
                    charCode = 247;
                    bgColor = color_2.colors.blue;
                    fgColor = color_2.scaleColor(color_2.colors.blue, 0.3);
                }
                else {
                    var t = Math.min(1.0, map.altitude[cellY * map.width + cellX] / 10);
                    t = ~~(t * 10) / 10;
                    bgColor = color_2.blendColors(bgColor, color_2.colors.green, t);
                }
                // if ((flags & CellFlag.Debug) !== 0) { bgColor = colors.blue; }
                if ((flags & 2 /* Visible */) === 0) {
                    fgColor = color_2.scaleColor(fgColor, 0.25);
                    bgColor = color_2.scaleColor(bgColor, 0.25);
                }
                var i = y * width + x;
                char[i] = charCode;
                fg[i] = fgColor;
                bg[i] = bgColor;
            }
        }
        if (cursorPos) {
            var path = map.calcPath(player_1.player.position, cursorPos);
            if (path) {
                for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
                    var p = path_1[_i];
                    var outX = p.x - corner.x;
                    var outY = p.y - corner.y;
                    if (outX >= 0 && outY >= 0 && outX < width && outY < height) {
                        var i = outY * width + outX;
                        char[i] = "*".charCodeAt(0);
                    }
                }
            }
        }
        var playerX = player_1.player.x - corner.x;
        var playerY = player_1.player.y - corner.y;
        if (playerX >= 0 && playerY >= 0 && playerX < width && playerY < height) {
            var i = playerY * width + playerX;
            char[i] = "@".charCodeAt(0);
            fg[i] = color_2.colors.white;
        }
        fov_1.fieldOfView(player_1.player.x, player_1.player.y, 13, function (x, y) {
            if (!map.isWalkable(x, y)) {
                return;
            }
            var dx = x - player_1.player.x;
            var dy = y - player_1.player.y;
            var d = Math.min(10, Math.sqrt(dx * dx + dy * dy));
            var t = (1 - (d / 10)) * 0.5;
            var outX = x - corner.x;
            var outY = y - corner.y;
            var color = color_2.makeColor(0xFF, 0xBF, 0x00);
            if (outX >= 0 && outY >= 0 && outX < width && outY < height) {
                var i = outY * width + outX;
                fg[i] = color_2.blendColors(fg[i], color, t);
                bg[i] = color_2.blendColors(bg[i], color, t);
            }
        }, function (x, y) { return !map.isWalkable(x, y); });
    }
    exports.drawMap = drawMap;
});
// adapted from http://pcg.wikidot.com/pcg-algorithm:maze
define("mapgen/maze", ["require", "exports", "mtrand", "util"], function (require, exports, mtrand_3, util_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Generate a perfect maze, that is a maze with all included points connected (no isolated passages),
     * and no loops (only one path between any two points).
     *
     * @param {Map} map The map in which to generate the maze.
     * @param {number=} branchrate
     *     Zero is unbiased, positive will make branches more frequent, negative will cause long passages.
     *     This controls the position in the list chosen: positive makes the start of the list more likely,
     *     negative makes the end of the list more likely.
     *     Large negative values make the original point obvious.
     *     Try values between -10, 10.
     */
    function generateMaze(map, branchrate) {
        if (branchrate === void 0) { branchrate = 0; }
        var width = map.width, height = map.height, flags = map.flags;
        // the grid of the maze
        var field = [0];
        field.length = width * height;
        for (var i = 0; i < width * height; ++i) {
            if ((flags[i] & 1 /* Walkable */) !== 0) {
                field[i] = 1 /* Empty */;
            }
            else {
                field[i] = 3 /* UndeterminedUnexposed */;
            }
        }
        // list of coordinates of exposed but undetermined cells.
        var frontier = [];
        var startX = mtrand_3.stdGen.intRange(0, width);
        var startY = mtrand_3.stdGen.intRange(0, height);
        carve(startX, startY);
        while (frontier.length > 0) {
            var pos = Math.pow(mtrand_3.stdGen.rnd(), Math.exp(-branchrate));
            var index = ~~(pos * frontier.length);
            var choice = frontier[index];
            var x = choice % width;
            var y = ~~(choice / width);
            if (check(x, y)) {
                carve(x, y);
            }
            else {
                harden(x, y);
            }
            frontier.splice(index, 1);
        }
        for (var y = 0; y < height; ++y) {
            for (var x = 0; x < width; ++x) {
                var i = y * width + x;
                if (field[i] === 3 /* UndeterminedUnexposed */) {
                    field[i] = 0 /* Wall */;
                }
                if (field[i] === 1 /* Empty */) {
                    map.setFlag(x, y, 1 /* Walkable */);
                }
            }
        }
        /**
         * Make the cell at x,y a space.
         *
         * Update the fronteer and field accordingly.
         * Note: this does not remove the current cell from frontier, it only adds new cells.
         */
        function carve(x, y) {
            var extra = [];
            field[y * width + x] = 1 /* Empty */;
            if (x > 0) {
                var i = y * width + x - 1;
                if (field[i] === 3 /* UndeterminedUnexposed */) {
                    field[i] = 2 /* UndeterminedExposed */;
                    extra.push(i);
                }
            }
            if (x < width - 1) {
                var i = y * width + x + 1;
                if (field[i] === 3 /* UndeterminedUnexposed */) {
                    field[i] = 2 /* UndeterminedExposed */;
                    extra.push(i);
                }
            }
            if (y > 0) {
                var i = (y - 1) * width + x;
                if (field[i] === 3 /* UndeterminedUnexposed */) {
                    field[i] = 2 /* UndeterminedExposed */;
                    extra.push(i);
                }
            }
            if (y < height - 1) {
                var i = (y + 1) * width + x;
                if (field[i] === 3 /* UndeterminedUnexposed */) {
                    field[i] = 2 /* UndeterminedExposed */;
                    extra.push(i);
                }
            }
            util_3.shuffleArray(extra);
            for (var _i = 0, extra_1 = extra; _i < extra_1.length; _i++) {
                var i = extra_1[_i];
                frontier.push(i);
            }
        }
        /**
         * Make the cell at x,y a wall.
         */
        function harden(x, y) {
            field[y * width + x] = 0 /* Wall */;
        }
        /**
         * Test the cell at x,y: can this cell become a space?
         *
         * true indicates it should become a space,
         * false indicates it should become a wall.
         */
        function check(x, y, diagonals) {
            if (diagonals === void 0) { diagonals = false; }
            var edgestate = 0;
            if (x > 0) {
                if (field[y * width + x - 1] === 1 /* Empty */) {
                    edgestate += 1;
                }
            }
            if (x < width - 1) {
                if (field[y * width + x + 1] === 1 /* Empty */) {
                    edgestate += 2;
                }
            }
            if (y > 0) {
                if (field[(y - 1) * width + x] === 1 /* Empty */) {
                    edgestate += 4;
                }
            }
            if (y < height - 1) {
                if (field[(y + 1) * width + x] === 1 /* Empty */) {
                    edgestate += 8;
                }
            }
            if (diagonals) {
                // diagonal walls are permitted
                return edgestate === 1 || edgestate === 2 || edgestate === 4 || edgestate === 8;
            }
            // if this would make a diagonal connecition, forbid it.
            // the following steps make the test a bit more complicated and are not necessary,
            // but without them the mazes don't look as good
            if (edgestate === 1) {
                if (x < width - 1) {
                    if (y > 0) {
                        if (field[(y - 1) * width + x + 1] === 1 /* Empty */) {
                            return false;
                        }
                    }
                    if (y < height - 1) {
                        if (field[(y + 1) * width + x + 1] === 1 /* Empty */) {
                            return false;
                        }
                    }
                }
                return true;
            }
            if (edgestate === 2) {
                if (x > 0) {
                    if (y > 0) {
                        if (field[(y - 1) * width + x - 1] === 1 /* Empty */) {
                            return false;
                        }
                    }
                    if (y < height - 1) {
                        if (field[(y + 1) * width + x - 1] === 1 /* Empty */) {
                            return false;
                        }
                    }
                }
                return true;
            }
            if (edgestate === 4) {
                if (y < height - 1) {
                    if (x > 0) {
                        if (field[(y + 1) * width + x - 1] === 1 /* Empty */) {
                            return false;
                        }
                    }
                    if (x < width - 1) {
                        if (field[(y + 1) * width + x + 1] === 1 /* Empty */) {
                            return false;
                        }
                    }
                }
                return true;
            }
            if (edgestate === 8) {
                if (y > 0) {
                    if (x > 0) {
                        if (field[(y - 1) * width + x - 1] === 1 /* Empty */) {
                            return false;
                        }
                    }
                    if (x < width - 1) {
                        if (field[(y - 1) * width + x + 1] === 1 /* Empty */) {
                            return false;
                        }
                    }
                }
                return true;
            }
            return false;
        }
    }
    exports.generateMaze = generateMaze;
});
define("mapgen/util", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Repeatedly calls doGenerate until it produces a contiguous area covering at least wantedFillThreshold
     * and in which all cells satisfy isMatch. Returns boolean array where true values are in the area.
     */
    function ensureContiguous(gen, width, height, wantedFillThreshold, doGenerate, isMatch) {
        var reachable = [false];
        var size = width * height;
        reachable.length = size;
        while (true) {
            doGenerate();
            for (var i = 0; i < size; ++i) {
                reachable[i] = false;
            }
            var reachableCount = fillReachable();
            // Regenerate if we didn't find a connected area covering a big enough fraction of total cells.
            if (reachableCount / size >= wantedFillThreshold) {
                return reachable;
            }
        }
        /**
         * Pick a random matching cell on the map, and flood fill every matching cell
         * reachable by 4-direction walk from there, marking them all as reachable.
         * Chances are that the cell we pick will be in the largest connected area.
         * @returns {number} Number of reachable cells.
         */
        function fillReachable() {
            var foundStart = false;
            var startX = 0;
            var startY = 0;
            for (var tries = 0; tries < 100; ++tries) {
                startX = gen.intRange(0, width);
                startY = gen.intRange(0, height);
                if (isMatch(startX, startY)) {
                    foundStart = true;
                    break;
                }
            }
            var reachableCount = 0;
            if (foundStart) {
                floodFill(startX, startY, width, height, function (x, y) { return !reachable[y * width + x] && isMatch(x, y); }, function (x, y) {
                    reachable[y * width + x] = true;
                    ++reachableCount;
                });
            }
            return reachableCount;
        }
    }
    exports.ensureContiguous = ensureContiguous;
    function floodFill(startX, startY, width, height, isUnvisitedMatch, visit) {
        if (startX < 0 || startY < 0 || startX >= width || startY >= height) {
            return;
        }
        if (!isUnvisitedMatch(startX, startY)) {
            return;
        }
        var stack = [startY * width + startX];
        while (stack.length > 0) {
            var index = stack.pop();
            var ox = index % width;
            var y = ~~(index / width);
            var x0 = ox;
            while (x0 > 0 && isUnvisitedMatch(x0 - 1, y)) {
                --x0;
            }
            var x1 = ox;
            while (x1 < width - 1 && isUnvisitedMatch(x1 + 1, y)) {
                ++x1;
            }
            var inNorthSegement = false;
            var inSouthSegement = false;
            for (var x = x0; x <= x1; ++x) {
                visit(x, y);
                if (y > 0) {
                    if (isUnvisitedMatch(x, y - 1)) {
                        if (!inNorthSegement) {
                            stack.push((y - 1) * width + x);
                            inNorthSegement = true;
                        }
                    }
                    else {
                        inNorthSegement = false;
                    }
                }
                if (y < height - 1) {
                    if (isUnvisitedMatch(x, y + 1)) {
                        if (!inSouthSegement) {
                            stack.push((y + 1) * width + x);
                            inSouthSegement = true;
                        }
                    }
                    else {
                        inSouthSegement = false;
                    }
                }
            }
        }
    }
    exports.floodFill = floodFill;
    function midpointDisplacement(gen, map, mapDim) {
        var side = mapDim;
        while (side >= 3) {
            diamondStep(gen, map, mapDim, side);
            squareStep(gen, map, mapDim, side);
            side = (side >>> 1) + 1;
        }
    }
    exports.midpointDisplacement = midpointDisplacement;
    function diamondStep(gen, map, mapDim, side) {
        var halfSide = side >>> 1;
        var step = side - 1;
        var maxDisplace = side * 0.1;
        for (var y = halfSide; y < mapDim; y += step) {
            for (var x = halfSide; x < mapDim; x += step) {
                var i = y * mapDim + x;
                if (map[i] === Number.MAX_VALUE) {
                    var topLeft = i - halfSide - mapDim * halfSide;
                    var topRight = topLeft + step;
                    var bottomLeft = topLeft + mapDim * step;
                    var bottomRight = bottomLeft + step;
                    var displace = gen.rnd() * maxDisplace - maxDisplace * 0.5;
                    map[i] = displace + (map[bottomRight] + map[bottomLeft] + map[topRight] + map[topLeft]) * 0.25;
                }
            }
        }
    }
    function squareStep(gen, map, mapDim, side) {
        var halfSide = side >>> 1;
        var step = side - 1;
        var maxDisplace = side * 0.1;
        for (var y = 0, even = 1; y < mapDim; y += halfSide, even = 1 - even) {
            for (var x = even * halfSide; x < mapDim; x += step) {
                var i = y * mapDim + x;
                if (map[i] === Number.MAX_VALUE) {
                    var top_1 = i - mapDim * halfSide;
                    if (top_1 < 0) {
                        top_1 += mapDim * mapDim - mapDim;
                    }
                    var bottom = i + mapDim * halfSide;
                    if (bottom >= mapDim * mapDim) {
                        bottom -= mapDim * mapDim - mapDim;
                    }
                    var left = i - halfSide;
                    if ((i % mapDim) === 0) {
                        left += mapDim - 1;
                    }
                    var right = i + halfSide;
                    if ((i % mapDim) === mapDim - 1) {
                        right -= mapDim - 1;
                    }
                    var displace = gen.rnd() * maxDisplace - maxDisplace * 0.5;
                    map[i] = displace + (map[top_1] + map[bottom] + map[left] + map[right]) * 0.25;
                }
            }
        }
    }
});
// adapted from: http://www.roguebasin.com/index.php?title=Cellular_Automata_Method_for_Generating_Random_Cave-Like_Levels
define("mapgen/cave", ["require", "exports", "mapgen/util"], function (require, exports, util_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function generateCave(map, gen) {
        var width = map.width, height = map.height, flags = map.flags;
        var cellCount = width * height;
        var walls = [false];
        var nextWalls = [false];
        var cellRules = [0];
        walls.length = cellCount;
        nextWalls.length = cellCount;
        cellRules.length = cellCount;
        // Just write walls to both entire arrays, so that borders in particular will be considered walls.
        // Border cells will not be rewritten later.
        for (var i = 0; i < cellCount; ++i) {
            walls[i] = true;
            nextWalls[i] = true;
        }
        var reachable = util_4.ensureContiguous(gen, width, height, 0.2, doGenerate, function (x, y) { return !walls[y * width + x]; });
        for (var i = 0; i < cellCount; ++i) {
            // Mark everything not reachable as walls.
            // This will eliminate caves disjoint from the one we found.
            walls[i] = !reachable[i];
            // Apply the generated cave to the actual map.
            if (!walls[i]) {
                flags[i] = 1 /* Walkable */;
            }
        }
        /**
         * Randomly generate every non-border cell,
         * then repeatedly evaluate different rule functions for nice organic cave-like structures.
         * The is will probably result in several disjoint areas.
         */
        function doGenerate() {
            for (var y = 1; y < height - 1; ++y) {
                for (var x = 1; x < width - 1; ++x) {
                    walls[y * width + x] = gen.rnd() < 0.55;
                }
            }
            var fourFiveRule = function (x, y) {
                var wall = isWall(x, y);
                var count = adjacentWallCount(x, y, 1);
                return (wall && count >= 4) || (!wall && count >= 5);
            };
            var rule1 = function (x, y) { return adjacentWallCount(x, y, 1) >= 5 || adjacentWallCount(x, y, 2) <= 2; };
            var rule2 = function (x, y) { return adjacentWallCount(x, y, 1) >= 5 || adjacentWallCount(x, y, 2) <= 1; };
            var rule3 = function (x, y) { return adjacentWallCount(x, y, 1) >= 5 || adjacentWallCount(x, y, 2) === 0; };
            var rule4 = function (x, y) { return adjacentWallCount(x, y, 1) >= 5; };
            var rules = [
                fourFiveRule,
                fourFiveRule,
                rule1,
                rule1,
                rule2,
                rule3,
                rule4,
                rule4,
                rule4,
            ];
            var pointsX = [0];
            var pointsY = [0];
            var pointRules = [0];
            function ruleAtPos(x, y) {
                var ruleIndex = 0;
                var dist = Number.MAX_VALUE;
                for (var i = 0; i < pointsX.length; ++i) {
                    var dx = x - pointsX[i];
                    var dy = y - pointsY[i];
                    var d = dx * dx + dy * dy;
                    if (d < dist) {
                        ruleIndex = pointRules[i];
                        dist = d;
                    }
                }
                return ruleIndex;
            }
            var superRule = function (x, y) { return rules[cellRules[y * width + x]](x, y); };
            var iters = gen.intRange(1, 4);
            for (var i = 0; i < iters; ++i) {
                for (var r = 0; r < 3; ++r) {
                    pointsX[r] = gen.intRange(0, width);
                    pointsY[r] = gen.intRange(0, height);
                    pointRules[r] = gen.intRange(0, rules.length);
                }
                for (var y = 1; y < height - 1; ++y) {
                    for (var x = 1; x < width - 1; ++x) {
                        cellRules[y * width + x] = ruleAtPos(x, y);
                    }
                }
                var ruleiters = gen.intRange(1, 5);
                for (var j = 0; j < ruleiters; ++j) {
                    iterate(superRule);
                }
            }
        }
        /** Evaluate the rule function at for every non-border cell. */
        function iterate(rule) {
            for (var y = 1; y < height - 1; ++y) {
                for (var x = 1; x < width - 1; ++x) {
                    nextWalls[y * width + x] = rule(x, y);
                }
            }
            var temp = walls;
            walls = nextWalls;
            nextWalls = temp;
        }
        /** Number of walls in square of giver radius around origin (not counting origin). */
        function adjacentWallCount(x, y, r) {
            if (r === void 0) { r = 1; }
            var count = 0;
            for (var dy = -r; dy <= r; ++dy) {
                for (var dx = -r; dx <= r; ++dx) {
                    if (dx === 0 && dy === 0) {
                        continue;
                    }
                    if (isWall(x + dx, y + dy)) {
                        ++count;
                    }
                }
            }
            return count;
        }
        /**
         * Is the cell at the given coordinate a wall?
         * All points outside of, and at the border of the map are considered walls.
         */
        function isWall(x, y) {
            if (x <= 0 || y <= 0 || x >= width - 1 || y >= height - 1) {
                return true;
            }
            return walls[y * width + x];
        }
    }
    exports.generateCave = generateCave;
});
define("mapgen/island", ["require", "exports", "mapgen/util"], function (require, exports, util_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MIN_LAND_FRACTION = 0.2;
    var CENTER_HEIGHT = 4;
    var FRINGE_HEIGHT = -2;
    function generateIsland(map, gen) {
        var dim = 16;
        while (dim + 1 < map.width || dim + 1 < map.height) {
            dim *= 2;
        }
        ++dim;
        var heightmap = [0];
        heightmap.length = dim * dim;
        // generate a big enough contigous island
        var reachable = util_5.ensureContiguous(gen, dim, dim, MIN_LAND_FRACTION, doGenerate, function (x, y) { return heightmap[y * dim + x] > 0; });
        // Now mark everything not reachable as sea.
        // This will eliminate land disjoint from the island.
        for (var i = 0; i < dim * dim; ++i) {
            if (!reachable[i] || heightmap[i] <= 0) {
                heightmap[i] = FRINGE_HEIGHT;
            }
        }
        var xOff = (map.width - dim) / 2;
        var yOff = (map.height - dim) / 2;
        for (var y = 0; y < dim; ++y) {
            for (var x = 0; x < dim; ++x) {
                var altitude = heightmap[dim * y + x];
                if (altitude > 0) {
                    map.setCell(x + xOff, y + yOff, {
                        flags: 1 /* Walkable */,
                        altitude: altitude,
                    });
                }
                else {
                    map.setFlag(x + xOff, y + yOff, 8 /* Water */);
                }
            }
        }
        function doGenerate() {
            for (var i = 0; i < dim * dim; ++i) {
                heightmap[i] = Number.MAX_VALUE;
            }
            heightmap[(dim * dim) >>> 1] = CENTER_HEIGHT;
            for (var x = 0; x < dim; ++x) {
                heightmap[x] = FRINGE_HEIGHT;
                heightmap[dim * (dim - 1) + x] = FRINGE_HEIGHT;
            }
            for (var y = 0; y < dim; ++y) {
                heightmap[y * dim] = FRINGE_HEIGHT;
                heightmap[(y + 1) * dim - 1] = FRINGE_HEIGHT;
            }
            util_5.midpointDisplacement(gen, heightmap, dim);
        }
    }
    exports.generateIsland = generateIsland;
});
define("ui/context", ["require", "exports", "color"], function (require, exports, color_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Props = /** @class */ (function () {
        function Props(x, y, width, height, clipLeft, clipTop, clipRight, clipBottom) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.clipLeft = clipLeft;
            this.clipTop = clipTop;
            this.clipRight = clipRight;
            this.clipBottom = clipBottom;
        }
        return Props;
    }());
    var UIContext = /** @class */ (function () {
        function UIContext(display) {
            this.display = display;
            this.stack = [];
            var top = this.top = new Props(0, 0, display.width, display.height, 0, 0, display.width, display.height);
        }
        UIContext.prototype.push = function (x, y, width, height) {
            var prevTop = this.top;
            this.stack.push(prevTop);
            var newX = prevTop.y + y;
            var newY = prevTop.y + y;
            var top = this.top = new Props(newX, newY, width, height, newX, newY, newX + width, newY + height);
            if (top.clipLeft < prevTop.clipLeft) {
                top.clipLeft = prevTop.clipLeft;
            }
            if (top.clipTop < prevTop.clipTop) {
                top.clipTop = prevTop.clipTop;
            }
            if (top.clipRight > prevTop.clipRight) {
                top.clipRight = prevTop.clipRight;
            }
            if (top.clipBottom > prevTop.clipBottom) {
                top.clipBottom = prevTop.clipBottom;
            }
        };
        UIContext.prototype.pop = function () {
            var top = this.stack.pop();
            if (!top) {
                throw new Error("pop on empty stack");
            }
            this.top = top;
        };
        UIContext.prototype.fillTop = function (ch, fgcolor, bgcolor) {
            if (ch === void 0) { ch = 0; }
            if (fgcolor === void 0) { fgcolor = color_3.colors.white; }
            if (bgcolor === void 0) { bgcolor = color_3.colors.black; }
            var top = this.top;
            this.fill(0, 0, top.width, top.height, ch, fgcolor, bgcolor);
        };
        UIContext.prototype.fill = function (x, y, width, height, ch, fgcolor, bgcolor) {
            if (ch === void 0) { ch = 0; }
            if (fgcolor === void 0) { fgcolor = color_3.colors.white; }
            if (bgcolor === void 0) { bgcolor = color_3.colors.black; }
            var top = this.top;
            var _a = this.display, char = _a.char, fg = _a.fg, bg = _a.bg;
            var displayWidth = this.display.width;
            var x0 = top.x + x;
            var y0 = top.y + y;
            var x1 = x0 + width;
            var y1 = y0 + height;
            if (x0 < top.clipLeft) {
                x0 = top.clipLeft;
            }
            if (y0 < top.clipTop) {
                y0 = top.clipTop;
            }
            if (x1 > top.clipRight) {
                x1 = top.clipRight;
            }
            if (y1 < top.clipBottom) {
                y1 = top.clipBottom;
            }
            for (var j = y0; j < y1; ++j) {
                for (var i = x0; i < x1; ++i) {
                    var index = j * displayWidth + i;
                    char[index] = ch;
                    fg[index] = fgcolor;
                    bg[index] = bgcolor;
                }
            }
        };
        UIContext.prototype.text = function (x, y, text, fgcolor, bgcolor) {
            if (fgcolor === void 0) { fgcolor = color_3.colors.white; }
            var top = this.top;
            var y0 = top.y + y;
            if (y0 < top.clipTop || y0 >= top.clipBottom) {
                return;
            }
            var textIndex = 0;
            var x0 = top.x + x;
            if (x0 < top.clipLeft) {
                x0 = top.clipLeft;
                textIndex = x0 - (top.x + x);
            }
            var x1 = top.x + x + text.length;
            if (x1 >= top.clipRight) {
                x1 = top.clipRight;
            }
            var _a = this.display, char = _a.char, fg = _a.fg, bg = _a.bg;
            var displayWidth = this.display.width;
            for (var i = x0; i < x1; ++i, ++textIndex) {
                var index = y0 * displayWidth + i;
                char[index] = text.charCodeAt(textIndex);
                fg[index] = fgcolor;
                if (bgcolor !== undefined) {
                    bg[index] = bgcolor;
                }
            }
        };
        UIContext.prototype.put = function (x, y, ch, fgcolor, bgcolor) {
            if (fgcolor === void 0) { fgcolor = color_3.colors.white; }
            if (bgcolor === void 0) { bgcolor = color_3.colors.black; }
            var top = this.top;
            x += top.x;
            y += top.y;
            if (x < top.clipLeft || y < top.clipTop || x >= top.clipRight || y >= top.clipBottom) {
                return;
            }
            var _a = this.display, char = _a.char, fg = _a.fg, bg = _a.bg;
            var displayWidth = this.display.width;
            var index = y * displayWidth + x;
            char[index] = ch;
            fg[index] = fgcolor;
            bg[index] = bgcolor;
        };
        return UIContext;
    }());
    exports.UIContext = UIContext;
});
/*
function test(ui: UIContext): void {
    ui.push(0, 0, 15, ui.height);
    ui.fill(colors.black);
    ui.text("Hello", 0, 0);

    ui.pop();
}
*/
define("index", ["require", "exports", "map", "mapdrawer", "display", "fov", "mtrand", "mapgen/cave", "entity/player", "ui/context", "color", "math"], function (require, exports, map_1, mapdrawer_1, display_1, fov_2, mtrand_4, cave_1, player_2, context_1, color_4, math_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ContextManager = /** @class */ (function () {
        function ContextManager(onChange) {
            this.onChange = onChange;
            this.contexts = [];
        }
        ContextManager.prototype.pop = function () {
            this.contexts.pop();
            this.onChange();
        };
        ContextManager.prototype.push = function (ctx) {
            this.contexts.push(ctx);
            this.onChange();
        };
        ContextManager.prototype.toggleContext = function (ctx) {
            var index = this.contexts.indexOf(ctx);
            if (index >= 0) {
                this.contexts.splice(index, 1);
            }
            else {
                this.contexts.push(ctx);
            }
            this.onChange();
        };
        ContextManager.prototype.dispatchDraw = function (display) {
            for (var _i = 0, _a = this.contexts; _i < _a.length; _i++) {
                var ctx = _a[_i];
                ctx.onDraw(display);
            }
        };
        ContextManager.prototype.dispatchKeyDown = function (e) {
            var i = this.contexts.length - 1;
            for (; i >= 0; --i) {
                if (this.contexts[i].onKeyDown(e)) {
                    break;
                }
            }
        };
        ContextManager.prototype.dispatchClick = function (x, y) {
            var i = this.contexts.length - 1;
            for (; i >= 0; --i) {
                if (this.contexts[i].onMouseClick(x, y)) {
                    break;
                }
            }
        };
        ContextManager.prototype.dispatchMouseMove = function (x, y) {
            var i = this.contexts.length - 1;
            for (; i >= 0; --i) {
                if (this.contexts[i].onMouseMove(x, y)) {
                    break;
                }
            }
        };
        return ContextManager;
    }());
    var ModalContext = /** @class */ (function () {
        function ModalContext(contextManager) {
            this.contextManager = contextManager;
        }
        ModalContext.prototype.onKeyDown = function (e) {
            return false;
        };
        ModalContext.prototype.onMouseMove = function (x, y) {
            return false;
        };
        ModalContext.prototype.onMouseClick = function (x, y) {
            return false;
        };
        return ModalContext;
    }());
    var InventoryContext = /** @class */ (function (_super) {
        __extends(InventoryContext, _super);
        function InventoryContext() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        InventoryContext.prototype.onDraw = function (display) {
            var ui = new context_1.UIContext(display);
            ui.fill(10, 10, 10, 10, 0, color_4.colors.white, color_4.colors.red);
        };
        InventoryContext.prototype.onKeyDown = function (e) {
            if (e.keyCode === "i".charCodeAt(0) || e.keyCode === "I".charCodeAt(0)) {
                this.contextManager.toggleContext(this);
            }
            return true;
        };
        return InventoryContext;
    }(ModalContext));
    var GameContext = /** @class */ (function (_super) {
        __extends(GameContext, _super);
        function GameContext(contextManager) {
            var _this = _super.call(this, contextManager) || this;
            _this.map = new map_1.Map(257, 257);
            player_2.player.map = _this.map;
            _this.inventorytContext = new InventoryContext(contextManager);
            _this.regenerateMap();
            return _this;
        }
        GameContext.prototype.regenerateMap = function () {
            var _a = this.map, width = _a.width, height = _a.height, flags = _a.flags;
            for (var i = 0; i < width * height; ++i) {
                flags[i] = 0;
            }
            cave_1.generateCave(this.map, mtrand_4.stdGen);
            // generateIsland(this.map, stdGen);
            var playerPos = this.map.randomWalkablePos();
            if (!playerPos) {
                throw new Error("unable to pick player pos");
            }
            player_2.player.position = playerPos;
            this.updateVisible();
        };
        GameContext.prototype.updateVisible = function () {
            var _this = this;
            this.map.resetVisible();
            fov_2.fieldOfView(player_2.player.x, player_2.player.y, 100, function (x, y) {
                _this.map.setFlag(x, y, 2 /* Visible */ | 4 /* Discovered */);
            }, function (x, y) { return !_this.map.isWalkable(x, y); });
        };
        GameContext.prototype.onDraw = function (display) {
            this.updateVisible();
            var corner = new math_3.Vec2(player_2.player.x - (display.width >>> 1), player_2.player.y - (display.height >>> 1));
            mapdrawer_1.drawMap(this.map, display, corner, new math_3.Vec2(0, 0));
        };
        GameContext.prototype.onKeyDown = function (e) {
            if (e.keyCode === 37) { // left
                player_2.player.move(6 /* West */);
            }
            else if (e.keyCode === 38) { // up
                player_2.player.move(0 /* North */);
            }
            else if (e.keyCode === 39) { // right
                player_2.player.move(2 /* East */);
            }
            else if (e.keyCode === 40) { // down
                player_2.player.move(4 /* South */);
            }
            else if (e.keyCode === "r".charCodeAt(0) || e.keyCode === "R".charCodeAt(0)) {
                this.regenerateMap();
            }
            else if (e.keyCode === "i".charCodeAt(0) || e.keyCode === "I".charCodeAt(0)) {
                this.contextManager.toggleContext(this.inventorytContext);
            }
            else {
                return false;
            }
            return true;
        };
        GameContext.prototype.onMouseMove = function (x, y) {
            return false;
        };
        return GameContext;
    }(ModalContext));
    /*
    function canvasCoordToWorldTileCoord(canvasX: number, canvasY: number): Vec2 {
        return canvasCoordToScreenTileCoord(canvasX, canvasY).add(mapDrawer.corner);
    }
    
    function canvasCoordToScreenTileCoord(canvasX: number, canvasY: number): Vec2 {
        const x = ~~(canvasX / display.charWidth);
        const y = ~~(canvasY / display.charHeight);
        return new Vec2(x, y);
    }
    
    function canvasCoordForWorldTileCoord(x: number, y: number): Vec2 {
        return new Vec2((x - mapDrawer.corner.x) * display.charWidth, (y - mapDrawer.corner.y) * display.charHeight);
    }
    */
    var Game = /** @class */ (function () {
        function Game() {
            var _this = this;
            this.cursorCell = new math_3.Vec2(0, 0);
            this.start = function () {
                Game.ensureImagesLoaded(_this.fontImages, _this.runGame);
            };
            this.runGame = function () {
                _this.recreateDisplay();
                window.addEventListener("resize", _this.resizeCanvas);
                document.addEventListener("keydown", _this.onKeyDown);
                _this.canvas.addEventListener("click", _this.onClick);
                document.addEventListener("mousemove", _this.onMouseMove);
                document.addEventListener("touchstart", _this.onTouchStart);
                document.addEventListener("touchmove", _this.onTouchMove);
                _this.contextManager.push(new GameContext(_this.contextManager));
                _this.display.redraw();
            };
            this.recreateDisplay = function () {
                if (_this.display) {
                    _this.display.destroy();
                }
                var factory = Game.readNumberSetting("forceCanvasDisplay", 0) ? display_1.makeCanvasDisplay : display_1.makeDisplay;
                _this.display = factory(_this.canvas, _this.fontImages[Game.readNumberSetting("fontNum", 0)], function () { return _this.contextManager.dispatchDraw(_this.display); });
                _this.resizeCanvas();
            };
            this.resizeCanvas = function () {
                _this.display.reshape(true);
            };
            this.onKeyDown = function (e) {
                if (e.keyCode === "c".charCodeAt(0) || e.keyCode === "C".charCodeAt(0)) {
                    var forceCanvasDisplay = Game.readNumberSetting("forceCanvasDisplay", 0) ? 0 : 1;
                    Game.writeNumberSetting("forceCanvasDisplay", forceCanvasDisplay);
                    location.reload();
                    return;
                }
                _this.contextManager.dispatchKeyDown(e);
                if (e.keyCode === "f".charCodeAt(0) || e.keyCode === "F".charCodeAt(0)) {
                    var fontNum = (Game.readNumberSetting("fontNum", -1) + 1) % 2;
                    Game.writeNumberSetting("fontNum", fontNum);
                    _this.recreateDisplay();
                }
                _this.display.redraw();
            };
            this.onClick = function (e) {
                var x = ~~(e.clientX / _this.display.charWidth);
                var y = ~~(e.clientY / _this.display.charHeight);
                _this.contextManager.dispatchClick(x, y);
                /*const gl = (this.display as any).gl;
                if (gl) {
                    const ext = gl.getExtension('WEBGL_lose_context');
                    if (ext) {
                        ext.loseContext();
                        setTimeout(() => {
                            ext.restoreContext();
                        }, 200);
                    }
                }*/
            };
            this.onMouseMove = function (e) {
                var x = ~~(e.clientX / _this.display.charWidth);
                var y = ~~(e.clientY / _this.display.charHeight);
                var cell = new math_3.Vec2(x, y);
                if (_this.cursorCell.distanceTo(cell) <= 0) {
                    return;
                }
                _this.cursorCell = cell;
                _this.contextManager.dispatchMouseMove(x, y);
                _this.display.redraw();
            };
            this.onTouchStart = function (e) {
                if (e.changedTouches.length === 1) {
                    var touch = e.changedTouches[0];
                    var p = new math_3.Vec2(touch.clientX, touch.clientY);
                    var top_2 = new math_3.Vec2(_this.canvas.width / 2, 0);
                    var topRight = new math_3.Vec2(_this.canvas.width, 0);
                    var right = new math_3.Vec2(_this.canvas.width, _this.canvas.height / 2);
                    var bottomRight = new math_3.Vec2(_this.canvas.width, _this.canvas.height);
                    var bottom = new math_3.Vec2(_this.canvas.width / 2, _this.canvas.height);
                    var bottomLeft = new math_3.Vec2(0, _this.canvas.height);
                    var left = new math_3.Vec2(0, _this.canvas.height / 2);
                    var topLeft = new math_3.Vec2(0, 0);
                    var dirs = [
                        [0 /* North */, p.sub(top_2).mag()],
                        [1 /* NorthEast */, p.sub(topRight).mag()],
                        [2 /* East */, p.sub(right).mag()],
                        [3 /* SouthEast */, p.sub(bottomRight).mag()],
                        [4 /* South */, p.sub(bottom).mag()],
                        [5 /* SouthWest */, p.sub(bottomLeft).mag()],
                        [6 /* West */, p.sub(left).mag()],
                        [7 /* NorthWest */, p.sub(topLeft).mag()],
                    ];
                    dirs.sort(function (a, b) { return a[1] - b[1]; });
                    player_2.player.move(dirs[0][0]);
                    _this.display.redraw();
                }
            };
            this.onTouchMove = function (e) {
                e.preventDefault();
            };
            document.addEventListener("contextmenu", function (event) { return event.preventDefault(); });
            this.canvas = document.getElementById("canvas");
            this.fontImages = [
                document.getElementById("fontImage1"),
                document.getElementById("fontImage2"),
            ];
            this.display = display_1.makeNullDisplay();
            this.contextManager = new ContextManager(function () { return _this.display.redraw(); });
        }
        Game.readNumberSetting = function (name, defValue) {
            if (defValue === void 0) { defValue = 0; }
            try {
                if (localStorage) {
                    var val = localStorage.getItem(name);
                    if (val) {
                        var num = parseInt(val, 10);
                        if (!isNaN(num)) {
                            return num;
                        }
                    }
                }
            }
            catch (e) {
                console.log("error reading value: " + name + ". returning default value: " + defValue + ". error: " + e);
            }
            return defValue;
        };
        Game.writeNumberSetting = function (name, value) {
            if (localStorage) {
                localStorage.setItem(name, value.toString(10));
            }
        };
        Game.ensureImagesLoaded = function (images, onAllLoaded) {
            var loadedCount = 0;
            for (var _i = 0, images_1 = images; _i < images_1.length; _i++) {
                var image = images_1[_i];
                if (image.complete && image.naturalHeight > 0) {
                    handleLoaded();
                }
                else {
                    image.onload = handleLoaded;
                }
            }
            function handleLoaded() {
                if (++loadedCount === images.length) {
                    onAllLoaded();
                }
            }
        };
        return Game;
    }());
    console.log("Starting game...");
    console.log("window.devicePixelRatio: " + window.devicePixelRatio);
    new Game().start();
});
//# sourceMappingURL=bundle.js.map