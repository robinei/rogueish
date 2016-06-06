import { CellFlag, Map } from "./map";
import { MapDrawer, makeMapDrawer } from "./mapdrawer";
import { Display, makeDisplay } from "./display";
import { fieldOfView } from "./fov";
import { stdGen } from "./mtrand";
// import { generateMaze } from "./mapgen/maze";
// import { generateCave } from "./mapgen/cave";
import { generateIsland } from "./mapgen/island";


function readNumberSetting(name: string, defValue: number = 0): number {
    if (localStorage) {
        const val = localStorage.getItem(name);
        if (val !== undefined) {
            const num = parseInt(val, 10);
            if (!isNaN(num)) {
                return num;
            }
        }
    }
    return defValue;
}

function writeNumberSetting(name: string, value: number): void {
    if (localStorage) {
        localStorage.setItem(name, value.toString(10));
    }
}

function ensureImagesLoaded(images: HTMLImageElement[], onAllLoaded: () => void): void {
    let loadedCount = 0;
    for (let image of images) {
        if (image.complete && image.naturalHeight > 0) {
            handleLoaded();
        } else {
            image.onload = handleLoaded;
        }
    }
    function handleLoaded() {
        if (++loadedCount === images.length) {
            onAllLoaded();
        }
    }
}


const map = new Map(257, 257);
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const fontImages = [
    <HTMLImageElement>document.getElementById("fontImage1"),
    <HTMLImageElement>document.getElementById("fontImage2"),
];
let display: Display;
let mapDrawer: MapDrawer;

ensureImagesLoaded(fontImages, runApp);



function regenerateMap() {
    const { width, height, flags } = map;
    for (let i = 0; i < width * height; ++i) {
        flags[i] = 0;
    }

    // generateCave(map);
    generateIsland(map, stdGen);

    mapDrawer.pathOrigin = map.randomWalkablePos();
    updateVisible();
}

function updateVisible() {
    map.resetVisible();
    if (mapDrawer.cursorPos) {
        fieldOfView(
            mapDrawer.cursorPos.x, mapDrawer.cursorPos.y, 100,
            (x, y) => {
                map.setFlag(x, y, CellFlag.Visible | CellFlag.Discovered);
            },
            (x, y) => !map.isWalkable(x, y)
        );
    }
}


function onDraw() {
    mapDrawer.draw();
}

function recreateDisplay() {
    if (display) {
        display.destroy();
    }
    display = makeDisplay(canvas, fontImages[readNumberSetting("fontNum", 0)], onDraw);
    mapDrawer = makeMapDrawer(map, display);
}

function runApp() {
    recreateDisplay();
    regenerateMap();
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
    resizeCanvas();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    display.reshape();
}

function onClick(e: MouseEvent) {
    mapDrawer.pathOrigin = mapDrawer.cursorPos;
    const p = mapDrawer.canvasCoordToWorldTileCoord(e.clientX, e.clientY);
    mapDrawer.corner.x = p.x - ~~(0.5 * canvas.width / display.charWidth);
    mapDrawer.corner.y = p.y - ~~(0.5 * canvas.height / display.charHeight);
    display.redraw();

    /*const gl = (display as any).gl;
    if (gl) {
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) {
            ext.loseContext();
            setTimeout(() => {
                ext.restoreContext();
            }, 200);
        }
    }*/
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
    } else if (e.keyCode === "r".charCodeAt(0) || e.keyCode === "R".charCodeAt(0)) {
        regenerateMap();
    } else if (e.keyCode === "f".charCodeAt(0) || e.keyCode === "F".charCodeAt(0)) {
        const fontNum = (readNumberSetting("fontNum", -1) + 1) % 2;
        writeNumberSetting("fontNum", fontNum);
        recreateDisplay();
    }
    display.redraw();
}

function onMouseMove(e: MouseEvent) {
    const pos = mapDrawer.canvasCoordToWorldTileCoord(e.clientX, e.clientY);
    if (pos.equals(mapDrawer.cursorPos)) {
        return;
    }
    mapDrawer.cursorPos = pos;
    updateVisible();
    display.redraw();
}
