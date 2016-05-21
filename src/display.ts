import { Color, colors, toStringColor } from './color';

const CHAR_DIM = 12;


export {
    CHAR_DIM,
    Display,
    DisplayProps,
    makeDisplay,
}



interface Display {
    getProps(): DisplayProps;
    reshape(): void;
    redraw(): void;
}

interface DisplayProps {
    width: number;
    height: number;
    char: number[];
    fg: Color[];
    bg: Color[];
}


function makeDisplay(canvas: HTMLCanvasElement, onInited: () => void, onDraw: () => void): Display {
    const context = canvas.getContext('2d');
    const font = new Image();
    font.onload = onInited;
    font.src = 'font.png';
    
    const black = colors.black;
    const white = colors.white;
    
    let width = 0;
    let height = 0;
    let char = [0];
    let fg = [white];
    let bg = [black];
    
    let prevWidth = 0;
    let prevHeight = 0;
    let prevChar = [0];
    let prevFg = [white];
    let prevBg = [black];
    
    const dirty = [false];
    let allDirty = true;
    
    
    function reshape() {
        width = Math.ceil(canvas.width / CHAR_DIM);
        height = Math.ceil(canvas.height / CHAR_DIM);
        
        char.length = width * height;
        fg.length = width * height;
        bg.length = width * height;
        dirty.length = width * height;
        allDirty = true;
        
        redraw();
    }
    
    function redraw() {
        window.requestAnimationFrame(draw);
    }
    
    function draw() {
        char.length = width * height;
        fg.length = width * height;
        bg.length = width * height;
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const i = y * width + x;
                char[i] = 0;
                fg[i] = colors.white;
                bg[i] = colors.black;
            }
        }
        
        onDraw();
        
        let dirtyCount = 0;
        let currFillColor: Color = undefined;
        
        context.globalCompositeOperation = 'source-over';
        
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const i = y * width + x;
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
                context.fillRect(x * CHAR_DIM, y * CHAR_DIM, CHAR_DIM, CHAR_DIM);
            }
        }
        
        // draw background underneath visible non-white characters
        context.globalCompositeOperation = 'destination-over';
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
                context.fillRect(x * CHAR_DIM, y * CHAR_DIM, CHAR_DIM, CHAR_DIM);
            }
        }
        
        context.globalCompositeOperation = 'source-over';
        
        const tempChar = char;
        const tempFg = fg;
        const tempBg = bg;
        
        char = prevChar;
        fg = prevFg;
        bg = prevBg;
        
        prevChar = tempChar;
        prevFg = tempFg;
        prevBg = tempBg;
        
        prevWidth = width;
        prevHeight = height;
        allDirty = false;
        
        //console.log('redraw ' + dirtyCount + '/' + (width * height));
    }
    
    return {
        getProps: () => ({
            width,
            height,
            char,
            fg,
            bg
        }),
        reshape,
        redraw
    };
}
