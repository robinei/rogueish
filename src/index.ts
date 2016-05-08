import { Map, CellFlag } from './map';
import { MapDrawer, TILE_DIM } from './mapdrawer';
import { fieldOfView } from './fov';

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
map.recalcWalls();

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
    window.requestAnimationFrame(drawCanvas);
}

function onKeyDown(e: KeyboardEvent) {
    if (e.keyCode === 37) { // left
        --mapDrawer.corner.x;
    } else if (e.keyCode === 38) { // up
        --mapDrawer.corner.y;
    } else if (e.keyCode === 39) { // right
        ++mapDrawer.corner.x;
    } else if (e.keyCode === 40) { // down
        ++mapDrawer.corner.y;
    } else if (e.keyCode === 32) { // space
    }
    window.requestAnimationFrame(drawCanvas);
}

function onMouseMove(e: MouseEvent) {
    const pos = mapDrawer.canvasCoordToWorldTileCoord(e.clientX, e.clientY);
    if (pos.equals(mapDrawer.cursorPos)) {
        return;
    }
    mapDrawer.cursorPos = pos;
    
    map.resetVisible();
    fieldOfView(pos.x, pos.y, 100, (x, y) => {
        map.setFlag(x, y, CellFlag.Visible | CellFlag.Discovered);
    }, (x, y) => !map.isWalkable(x, y));
    
    window.requestAnimationFrame(drawCanvas);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.requestAnimationFrame(drawCanvas);
}

function drawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    mapDrawer.draw(canvas, context);
}

