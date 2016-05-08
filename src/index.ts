import { Map, CellFlag } from './map';
import { MapDrawer, TILE_DIM } from './mapdrawer';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d');

const map = new Map(80, 50);
const mapDrawer = new MapDrawer(map, runApp);

map.forNeighbours(20, 20, 10, (x, y) => {
    map.setFlag(x, y, CellFlag.Walkable);
    return true;
});
map.forNeighbours(40, 20, 10, (x, y) => {
    map.setFlag(x, y, CellFlag.Walkable);
    return true;
});

function runApp() {
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);
    resizeCanvas();
}

function onClick(e: MouseEvent) {
    console.log("click");
    const p = mapDrawer.canvasCoordToWorldTileCoord(e.clientX, e.clientY);
    mapDrawer.corner.x = p.x - Math.floor(0.5 * canvas.width / TILE_DIM);
    mapDrawer.corner.y = p.y - Math.floor(0.5 * canvas.height / TILE_DIM);
    drawCanvas();
}

function onKeyDown(e: KeyboardEvent) {
    if (e.keyCode == 37) { // left
        --mapDrawer.corner.x;
    } else if (e.keyCode == 38) { // up
        --mapDrawer.corner.y;
    } else if (e.keyCode == 39) { // right
        ++mapDrawer.corner.x;
    } else if (e.keyCode == 40) { // down
        ++mapDrawer.corner.y;
    } else if (e.keyCode == 32) { // space
    }
    drawCanvas();
}

function onMouseMove(e: MouseEvent) {
    const pos = mapDrawer.canvasCoordToWorldTileCoord(e.clientX, e.clientY);
    if (pos.equals(mapDrawer.cursorPos)) {
        return;
    }
    mapDrawer.cursorPos = pos;
    drawCanvas();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawCanvas(); 
}

function drawCanvas() {
    context.globalCompositeOperation = 'copy';
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = 'source-over';
    
    mapDrawer.draw(canvas, context);
    
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = 'source-over';
}

