import { Color, colors, toStringColor } from './color';

export const CHAR_DIM = 12;

export class Display {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private font: HTMLImageElement;
    
    width: number = 0;
    height: number = 0;
    char: number[] = [];
    fg: Color[] = [];
    bg: Color[] = [];
    
    private prevWidth: number = 0;
    private prevHeight: number = 0;
    private prevChar: number[] = [];
    private prevFg: Color[] = [];
    private prevBg: Color[] = [];
    
    private allDirty: boolean = true;
    private dirty: boolean[] = [];
    
    private onDraw: () => void;
    
    constructor(canvas: HTMLCanvasElement, onInited: () => void, onDraw: () => void) {
        this.onDraw = onDraw;
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.font = new Image();
        this.font.onload = onInited;
        this.font.src = 'font.png';
    }
    
    reshape = () => {
        const w = Math.ceil(this.canvas.width / CHAR_DIM);
        const h = Math.ceil(this.canvas.height / CHAR_DIM);
        
        this.width = w;
        this.height = h;
        this.char.length = w * h;
        this.fg.length = w * h;
        this.bg.length = w * h;
        this.allDirty = true;
        
        this.redraw();
    };
    
    redraw = () => {
        window.requestAnimationFrame(this.draw);
    };
    
    private draw = () => {
        const context = this.context;
        const font = this.font;
        const w = this.width;
        const h = this.height;
        const char = this.char;
        const fg = this.fg;
        const bg = this.bg;
        const prevWidth = this.prevWidth;
        const prevHeight = this.prevHeight;
        const prevChar = this.prevChar;
        const prevFg = this.prevFg;
        const prevBg = this.prevBg;
        const allDirty = this.allDirty;
        const dirty = this.dirty;
        const black = colors.black;
        const white = colors.white;
        
        char.length = w * h;
        fg.length = w * h;
        bg.length = w * h;
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                const i = y * w + x;
                char[i] = 0;
                fg[i] = colors.white;
                bg[i] = colors.black;
            }
        }
        
        this.onDraw();
        
        let dirtyCount = 0;
        let currFillColor = -1;
        
        context.globalCompositeOperation = 'source-over';
        
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                const i = y * w + x;
                if (!allDirty) {
                    if (x < prevWidth && y < prevHeight) {
                        const j = y * prevWidth + x;
                        dirty[i] = char[i] != prevChar[j] || fg[i] != prevFg[j] || bg[i] != prevBg[j];
                    } else {
                        dirty[i] = true;
                    }
                    if (!dirty[i]) {
                        continue;
                    }
                }
                ++dirtyCount;
                
                // now we draw the background using 'source-over' (the fastest mode)
                // for cells which aren't black (because that is the default background color),
                // and which have white (or invisible) foreground characters.
                // non-white (and visible) characters need background drawn last, using 'destination-over', so skip them for now.
                if (bg[i] === black || fg[i] !== white && char[i] !== 0 && char[i] !== 32) {
                    context.clearRect(x * CHAR_DIM, y * CHAR_DIM, CHAR_DIM, CHAR_DIM);
                } else {
                    if (currFillColor !== bg[i]) {
                        context.fillStyle = toStringColor(bg[i]);
                        currFillColor = bg[i];
                    }
                    context.fillRect(x * CHAR_DIM, y * CHAR_DIM, CHAR_DIM, CHAR_DIM);
                }
                
                if (char[i] === 0 || char[i] === 32) {
                    continue;
                }
                // draw the foreground characters (using a white font)
                const sx = (char[i] % 16) * CHAR_DIM;
                const sy = Math.floor(char[i] / 16) * CHAR_DIM;
                context.drawImage(font, sx, sy, CHAR_DIM, CHAR_DIM, x * CHAR_DIM, y * CHAR_DIM, CHAR_DIM, CHAR_DIM);
            }
        }
        
        // apply color onto non-white characters (this is why background must come last for these cells)
        context.globalCompositeOperation = 'source-atop';
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                const i = y * w + x;
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
                context.fillRect(x * CHAR_DIM, y * CHAR_DIM, CHAR_DIM, CHAR_DIM);
            }
        }
        
        // draw background underneath visible non-white characters
        context.globalCompositeOperation = 'destination-over';
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                const i = y * w + x;
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
                context.fillRect(x * CHAR_DIM, y * CHAR_DIM, CHAR_DIM, CHAR_DIM);
            }
        }
        
        context.globalCompositeOperation = 'source-over';
        
        this.prevWidth = w;
        this.prevHeight = h;
        this.prevChar = char;
        this.prevFg = fg;
        this.prevBg = bg;
        this.char = prevChar;
        this.fg = prevFg;
        this.bg = prevBg;
        this.allDirty = false;
        
        //console.log('redraw ' + dirtyCount + '/' + (w * h));
    };
}
