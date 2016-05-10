import { Map, CellFlag } from './map';
import { Display, CHAR_DIM } from './display';
import { Vec2 } from './math';
import { Color, colors, scaleColor } from './color';

export class MapDrawer {
    map: Map;
    display: Display;
    corner: Vec2 = new Vec2(0, 0);
    cursorPos: Vec2;
    
    constructor(map: Map, display: Display) {
        this.map = map;
        this.display = display;
    }
    
    canvasCoordToWorldTileCoord = (canvasX: number, canvasY: number) => {
        return this.canvasCoordToScreenTileCoord(canvasX, canvasY).add(this.corner);
    };
    
    canvasCoordToScreenTileCoord = (canvasX: number, canvasY: number) => {
        const x = Math.floor(canvasX / CHAR_DIM);
        const y = Math.floor(canvasY / CHAR_DIM);
        return new Vec2(x, y);
    };
    
    canvasCoordForWorldTileCoord = (x: number, y: number) => {
        return new Vec2((x - this.corner.x) * CHAR_DIM, (y - this.corner.y) * CHAR_DIM);
    };
    
    draw = () => {
        const w = this.display.width;
        const h = this.display.height;
        const char = this.display.char;
        const fg = this.display.fg;
        const bg = this.display.bg;
        
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                const cellx = x + this.corner.x;
                const celly = y + this.corner.y;
                if (cellx < 0 || celly < 0 || cellx >= this.map.width || celly >= this.map.height) {
                    continue;
                }
                
                let flags = this.map.getFlags(cellx, celly);
                
                let charcode = '.'.charCodeAt(0);
                let bgcolor = colors.black;
                let fgcolor = colors.white;
                if ((flags & CellFlag.Walkable) === 0) {
                    if ((flags & CellFlag.Wall) != 0) {
                        charcode = '#'.charCodeAt(0);
                        fgcolor = colors.yellow;
                        bgcolor = colors.gray;
                    } else {
                        charcode = '?'.charCodeAt(0);
                    }
                }
                
                if ((flags & CellFlag.Visible) === 0) {
                    fgcolor = scaleColor(fgcolor, 0.5);
                    bgcolor = scaleColor(bgcolor, 0.5);
                }
                
                const i = y * w + x;
                char[i] = charcode;
                fg[i] = fgcolor;
                bg[i] = bgcolor;
            }
        }
    };
}
