import { Map, CellFlag } from './map';
import { Vec2 } from './math';

export const TILE_DIM = 12;

export class MapDrawer {
    map: Map;
    corner: Vec2 = new Vec2(0, 0);
    cursorPos: Vec2;
    font: HTMLImageElement;
    
    constructor(map: Map, onInited: () => void) {
        this.map = map;
        this.font = new Image();
        this.font.onload = onInited;
        this.font.src = 'font.png';
    }
    
    canvasCoordToWorldTileCoord = (canvasX: number, canvasY: number) => {
        return this.canvasCoordToScreenTileCoord(canvasX, canvasY).add(this.corner);
    };
    
    canvasCoordToScreenTileCoord = (canvasX: number, canvasY: number) => {
        const x = Math.floor(canvasX / TILE_DIM);
        const y = Math.floor(canvasY / TILE_DIM);
        return new Vec2(x, y);
    };
    
    canvasCoordForWorldTileCoord = (x: number, y: number) => {
        return new Vec2((x - this.corner.x) * TILE_DIM, (y - this.corner.y) * TILE_DIM);
    };
    
    draw = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
        const drawChar = (charIndex: number, canvasX: number, canvasY: number) => {
            const sx = (charIndex % 16) * TILE_DIM;
            const sy = Math.floor(charIndex / 16) * TILE_DIM;
            context.drawImage(this.font, sx, sy, TILE_DIM, TILE_DIM, canvasX, canvasY, TILE_DIM, TILE_DIM);
        };
        
        let cellCount = 0;
        const canvasX: number[] = [];
        const canvasY: number[] = [];
        const cellX: number[] = [];
        const cellY: number[] = [];
        const charCode: number[] = [];
        const bgColor: string[] = [];
        const fgColor: string[] = [];
        const shaded: boolean[] = [];
        
        for (let y = 0; ; ++y) {
            const canvasy = y * TILE_DIM;
            if (canvasy > canvas.height) {
                break;
            }
            for (let x = 0; ; ++x) {
                const canvasx = x * TILE_DIM;
                if (canvasx > canvas.width) {
                    break;
                }
                
                const cellx = x + this.corner.x;
                const celly = y + this.corner.y;
                if (cellx < 0 || celly < 0 || cellx >= this.map.width || celly >= this.map.height) {
                    continue;
                }
                
                let flags = this.map.getFlags(cellx, celly);
                /*if ((flags & CellFlag.Discovered) === 0) {
                    continue;
                }*/
                
                let charcode = '.'.charCodeAt(0);
                let bgcolor = 'black';
                let fgcolor = 'white';
                if ((flags & CellFlag.Walkable) === 0) {
                    if ((flags & CellFlag.Wall) != 0) {
                        charcode = '#'.charCodeAt(0);
                        fgcolor = 'yellow';
                        bgcolor = 'darkgray';
                    } else {
                        charcode = '?'.charCodeAt(0);
                        bgcolor = '#333333';
                    }
                }
                
                canvasX.push(canvasx);
                canvasY.push(canvasy);
                cellX.push(cellx);
                cellY.push(celly);
                charCode.push(charcode);
                bgColor.push(bgcolor);
                fgColor.push(fgcolor);
                shaded.push((flags & CellFlag.Visible) === 0);
                ++cellCount;
            }
        }
        
        context.globalCompositeOperation = 'source-over';
        
        // draw background first using 'source-over' for tiles which have the default (white) or no foreground 
        for (var i = 0; i < cellCount; ++i) {
            if (bgColor[i] === 'black' || bgColor[i] === '#000000') {
                continue; // black background is the default
            }
            if (fgColor[i] !== 'white' && fgColor[i] !== '#ffffff' && charCode[i] !== 0 && charCode[i] !== 32) {
                continue; // non-white, visible characters need background drawn last, using 'destination-over'
            }
            if (context.fillStyle !== bgColor[i]) {
                context.fillStyle = bgColor[i];
            }
            context.fillRect(canvasX[i], canvasY[i], TILE_DIM, TILE_DIM);
        }
        
        // draw the foreground characters (using a white font)
        for (var i = 0; i < cellCount; ++i) {
            if (charCode[i] === 0 || charCode[i] === 32) {
                continue;
            }
            drawChar(charCode[i], canvasX[i], canvasY[i]);
        }
        
        // apply color onto non-white characters
        context.globalCompositeOperation = 'source-atop';
        for (var i = 0; i < cellCount; ++i) {
            if (fgColor[i] === 'white' || fgColor[i] === '#ffffff' || charCode[i] === 0 || charCode[i] === 32) {
                continue; // white or invisible characters don't need to be colored
            }
            if (context.fillStyle !== fgColor[i]) {
                context.fillStyle = fgColor[i];
            }
            context.fillRect(canvasX[i], canvasY[i], TILE_DIM, TILE_DIM);
        }
        
        // draw background underneath visible non-white characters
        context.globalCompositeOperation = 'destination-over';
        for (var i = 0; i < cellCount; ++i) {
            if (bgColor[i] === 'black' || bgColor[i] === '#000000') {
                continue; // black background is the default
            }
            if (fgColor[i] === 'white' || fgColor[i] === '#ffffff' || charCode[i] === 0 || charCode[i] === 32) {
                continue; // white or invisible characters have already had their background drawn
            }
            if (context.fillStyle !== bgColor[i]) {
                context.fillStyle = bgColor[i];
            }
            context.fillRect(canvasX[i], canvasY[i], TILE_DIM, TILE_DIM);
        }
        
        context.globalCompositeOperation = 'source-over';
        
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        for (var i = 0; i < cellCount; ++i) {
            if (shaded[i]) {
                context.fillRect(canvasX[i], canvasY[i], TILE_DIM, TILE_DIM);
            }
        }
        
        if (this.cursorPos) {
            const canvasCoord = this.canvasCoordForWorldTileCoord(this.cursorPos.x, this.cursorPos.y);
            context.fillStyle = "rgba(255, 255, 255, 0.3)";
            context.fillRect(canvasCoord.x, canvasCoord.y, TILE_DIM, TILE_DIM);
        }
    };
}
