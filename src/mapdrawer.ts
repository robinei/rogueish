import { Map } from './map';
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
        
        const forVisibleCells = (func: (canvasX: number, canvasY: number, cellX: number, cellY: number) => void) => {
            for (let y = 0; ; ++y) {
                const canvasY = y * TILE_DIM;
                if (canvasY > canvas.height) {
                    break;
                }
                for (let x = 0; ; ++x) {
                    const canvasX = x * TILE_DIM;
                    if (canvasX > canvas.width) {
                        break;
                    }
                    const cellX = x + this.corner.x;
                    const cellY = y + this.corner.y;
                    if (cellX < 0 || cellY < 0 || cellX >= this.map.width || cellY >= this.map.height) {
                        continue;
                    }
                    func(canvasX, canvasY, cellX, cellY);
                }
            }
        };
        
        context.globalCompositeOperation = 'source-over';
        forVisibleCells((canvasX, canvasY, cellX, cellY) => {
            let charIndex = '.'.charCodeAt(0);
            if (!this.map.isWalkable(cellX, cellY)) {
                charIndex = '#'.charCodeAt(0);
            }
            drawChar(charIndex, canvasX, canvasY);
        });
        
        context.globalCompositeOperation = 'source-atop';
        context.fillStyle = 'yellow';
        forVisibleCells((canvasX, canvasY, cellX, cellY) => {
            context.fillRect(canvasX, canvasY, TILE_DIM, TILE_DIM);
        });
        
        context.globalCompositeOperation = 'destination-over';
        context.fillStyle = 'darkgray';
        forVisibleCells((canvasX, canvasY, cellX, cellY) => {
            context.fillRect(canvasX, canvasY, TILE_DIM, TILE_DIM);
        });
        
        context.globalCompositeOperation = 'source-over';
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        forVisibleCells((canvasX, canvasY, cellX, cellY) => {
            if (!this.map.isVisible(cellX, cellY)) {
                context.fillRect(canvasX, canvasY, TILE_DIM, TILE_DIM);
            }
        });
        
        context.globalCompositeOperation = 'source-over';
        if (this.cursorPos) {
            const canvasCoord = this.canvasCoordForWorldTileCoord(this.cursorPos.x, this.cursorPos.y);
            context.fillStyle = "rgba(255, 255, 255, 0.3)";
            context.fillRect(canvasCoord.x, canvasCoord.y, TILE_DIM, TILE_DIM);
        }
    };
}
