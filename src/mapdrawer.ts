import { Map, CellFlag } from './map';
import { Display, CHAR_DIM } from './display';
import { Vec2 } from './math';
import { Color, colors, scaleColor, blendColors } from './color';
import { fieldOfView } from './fov';


export {
    MapDrawer,
    makeMapDrawer
}


interface MapDrawer {
    corner: Vec2;
    cursorPos: Vec2;
    pathOrigin: Vec2;
    canvasCoordToWorldTileCoord(canvasX: number, canvasY: number): Vec2;
    canvasCoordToScreenTileCoord(canvasX: number, canvasY: number): Vec2;
    canvasCoordForWorldTileCoord(x: number, y: number): Vec2;
    draw(): void;
}


function makeMapDrawer(map: Map, display: Display): MapDrawer {
    const mapDrawer: MapDrawer = {
        corner: new Vec2(0, 0),
        cursorPos: undefined,
        pathOrigin: undefined,
        canvasCoordToWorldTileCoord,
        canvasCoordToScreenTileCoord,
        canvasCoordForWorldTileCoord,
        draw,
    };
    
    function canvasCoordToWorldTileCoord(canvasX: number, canvasY: number): Vec2 {
        return canvasCoordToScreenTileCoord(canvasX, canvasY).add(mapDrawer.corner);
    }
    
    function canvasCoordToScreenTileCoord(canvasX: number, canvasY: number): Vec2 {
        const x = Math.floor(canvasX / CHAR_DIM);
        const y = Math.floor(canvasY / CHAR_DIM);
        return new Vec2(x, y);
    }
    
    function canvasCoordForWorldTileCoord(x: number, y: number): Vec2 {
        return new Vec2((x - mapDrawer.corner.x) * CHAR_DIM, (y - mapDrawer.corner.y) * CHAR_DIM);
    }
    
    function draw(): void {
        const { width, height, char, fg, bg } = display.getProps();
        
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const cellX = x + mapDrawer.corner.x;
                const cellY = y + mapDrawer.corner.y;
                if (cellX < 0 || cellY < 0 || cellX >= map.width || cellY >= map.height) {
                    continue;
                }
                
                let flags = map.getFlags(cellX, cellY);
                
                //if ((flags & CellFlag.Discovered) === 0) { continue; }
                
                let charCode = '.'.charCodeAt(0);
                let bgColor = colors.black;
                let fgColor = colors.white;
                if ((flags & CellFlag.Walkable) === 0) {
                    if (map.isWall(cellX, cellY)) {
                        charCode = '#'.charCodeAt(0);
                        fgColor = colors.yellow;
                        bgColor = colors.gray;
                    } else {
                        charCode = '?'.charCodeAt(0);
                    }
                }
                
                if ((flags & CellFlag.Visible) === 0) {
                    fgColor = scaleColor(fgColor, 0.5);
                    bgColor = scaleColor(bgColor, 0.5);
                }
                
                const i = y * width + x;
                char[i] = charCode;
                fg[i] = fgColor;
                bg[i] = bgColor;
            }
        }
        
        if (!mapDrawer.cursorPos) {
            return;
        }
        
        if (mapDrawer.pathOrigin) {
            const path = map.calcPath(mapDrawer.pathOrigin, mapDrawer.cursorPos);
            if (path) {
                for (let p of path) {
                    const outX = p.x - mapDrawer.corner.x;
                    const outY = p.y - mapDrawer.corner.y;
                    if (outX >= 0 && outY >= 0 && outX < width && outY < height) {
                        const i = outY * width + outX;
                        char[i] = '*'.charCodeAt(0);
                    }
                }
            }
        }
        
        fieldOfView(mapDrawer.cursorPos.x, mapDrawer.cursorPos.y, 13, (x, y) => {
            if (!map.isWalkable(x, y)) {
                return;
            }
            const dx = x - mapDrawer.cursorPos.x;
            const dy = y - mapDrawer.cursorPos.y;
            const d = Math.min(10, Math.sqrt(dx * dx + dy * dy));
            const t = 1 - (d / 10);
            const outX = x - mapDrawer.corner.x;
            const outY = y - mapDrawer.corner.y;
            if (outX >= 0 && outY >= 0 && outX < width && outY < height) {
                const i = outY * width + outX;
                fg[i] = blendColors(fg[i], colors.red, t);
                bg[i] = blendColors(bg[i], colors.red, t);
            }
        }, (x, y) => !map.isWalkable(x, y));
        
        const cursorX = mapDrawer.cursorPos.x - mapDrawer.corner.x;
        const cursorY = mapDrawer.cursorPos.y - mapDrawer.corner.y;
        if (cursorX >= 0 && cursorY >= 0 && cursorX < width && cursorY < height) {
            const i = cursorY * width + cursorX;
            char[i] = '@'.charCodeAt(0);
            fg[i] = colors.white;
        }
    }
    
    return mapDrawer;
}
