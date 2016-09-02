import { CellFlag, Map } from "./map";
import { MapDrawer, makeMapDrawer } from "./mapdrawer";
import { Display, makeDisplay } from "./display";
import { fieldOfView } from "./fov";
import { stdGen } from "./mtrand";
// import { generateMaze } from "./mapgen/maze";
import { generateCave } from "./mapgen/cave";
// import { generateIsland } from "./mapgen/island";
import { player } from "./entity/player";
import { Direction } from "./direction";


function readNumberSetting(name: string, defValue: number = 0): number {
    if (localStorage) {
        const val = localStorage.getItem(name);
        if (val) {
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
player.map = map;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const fontImages = [
    document.getElementById("fontImage1") as HTMLImageElement,
    document.getElementById("fontImage2") as HTMLImageElement,
];
let display: Display;
let mapDrawer: MapDrawer;

ensureImagesLoaded(fontImages, runApp);



function regenerateMap() {
    const { width, height, flags } = map;
    for (let i = 0; i < width * height; ++i) {
        flags[i] = 0;
    }

    generateCave(map, stdGen);
    // generateIsland(map, stdGen);

    const playerPos = map.randomWalkablePos();
    if (!playerPos) {
        throw new Error("unable to pick player pos");
    }
    player.position = playerPos;
    updateVisible();
}

function updateVisible() {
    map.resetVisible();
    fieldOfView(
        player.x, player.y, 100,
        (x, y) => {
            map.setFlag(x, y, CellFlag.Visible | CellFlag.Discovered);
        },
        (x, y) => !map.isWalkable(x, y)
    );
}


function onDraw() {
    mapDrawer.corner.x = player.x - (display.width >>> 1);
    mapDrawer.corner.y = player.y - (display.height >>> 1);
    updateVisible();
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
    display.reshape(true);
}

function onClick(e: MouseEvent) {
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
        player.move(Direction.West);
    } else if (e.keyCode === 38) { // up
        player.move(Direction.North);
    } else if (e.keyCode === 39) { // right
        player.move(Direction.East);
    } else if (e.keyCode === 40) { // down
        player.move(Direction.South);
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
    if (!mapDrawer.cursorPos) {
        return;
    }
    const pos = mapDrawer.canvasCoordToWorldTileCoord(e.clientX, e.clientY);
    if (pos.equals(mapDrawer.cursorPos)) {
        return;
    }
    mapDrawer.cursorPos = pos;
    display.redraw();
}
