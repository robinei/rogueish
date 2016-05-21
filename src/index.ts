import { Map, CellFlag } from './map';
import { MapDrawer } from './mapdrawer';
import { CHAR_DIM, Display, makeDisplay } from './display';
import { fieldOfView } from './fov';
import { toStringColor, makeColor } from './color';


const map = new Map(80, 50);
map.forNeighbours(20, 20, 10, (x, y) => {
    map.setFlag(x, y, CellFlag.Walkable);
    return true;
});
map.forNeighbours(40, 20, 10, (x, y) => {
    map.setFlag(x, y, CellFlag.Walkable);
    return true;
});
map.recalcWalls();


const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const display = makeDisplay(canvas, runApp, onDraw);
const mapDrawer = new MapDrawer(map, display);


function onDraw() {
    mapDrawer.draw();
}

function runApp() {
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);
    resizeCanvas();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    display.reshape();
}

function onClick(e: MouseEvent) {
    console.log("click");
    const p = mapDrawer.canvasCoordToWorldTileCoord(e.clientX, e.clientY);
    mapDrawer.corner.x = p.x - Math.floor(0.5 * canvas.width / CHAR_DIM);
    mapDrawer.corner.y = p.y - Math.floor(0.5 * canvas.height / CHAR_DIM);
    display.redraw();
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
    display.redraw();
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
    
    display.redraw();
}

