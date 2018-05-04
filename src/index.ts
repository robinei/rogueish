import { CellFlag, Map } from "./map";
import { drawMap } from "./mapdrawer";
import { Display, makeDisplay, makeCanvasDisplay, makeNullDisplay } from "./display";
import { fieldOfView } from "./fov";
import { stdGen } from "./mtrand";
import { generateMaze } from "./mapgen/maze";
import { generateCave } from "./mapgen/cave";
import { generateIsland } from "./mapgen/island";
import { player } from "./entity/player";
import { Direction } from "./direction";
import { UIContext } from "./ui/context";
import { colors } from "./color";
import { Vec2 } from "./math";



class ContextManager {
    private contexts: ModalContext[] = [];

    constructor(private onChange: () => void) {
    }

    pop() {
        this.contexts.pop();
        this.onChange();
    }

    push(ctx: ModalContext) {
        this.contexts.push(ctx);
        this.onChange();
    }

    toggleContext(ctx: ModalContext) {
        const index = this.contexts.indexOf(ctx);
        if (index >= 0) {
            this.contexts.splice(index, 1);
        } else {
            this.contexts.push(ctx);
        }
        this.onChange();
    }

    dispatchDraw(display: Display) {
        for (const ctx of this.contexts) {
            ctx.onDraw(display);
        }
    }

    dispatchKeyDown(e: KeyboardEvent) {
        let i = this.contexts.length - 1;
        for (; i >= 0; --i) {
            if (this.contexts[i].onKeyDown(e)) {
                break;
            }
        }
    }

    dispatchClick(x: number, y: number) {
        let i = this.contexts.length - 1;
        for (; i >= 0; --i) {
            if (this.contexts[i].onMouseClick(x, y)) {
                break;
            }
        }
    }

    dispatchMouseMove(x: number, y: number) {
        let i = this.contexts.length - 1;
        for (; i >= 0; --i) {
            if (this.contexts[i].onMouseMove(x, y)) {
                break;
            }
        }
    }
}


abstract class ModalContext {
    protected constructor(protected contextManager: ContextManager) {
    }

    abstract onDraw(display: Display): void;

    onKeyDown(e: KeyboardEvent): boolean {
        return false;
    }
    onMouseMove(x: number, y: number): boolean {
        return false;
    }
    onMouseClick(x: number, y: number): boolean {
        return false;
    }
}




class InventoryContext extends ModalContext {
    onDraw(display: Display): void {
        const ui = new UIContext(display);
        ui.fill(10, 10, 10, 10, 0, colors.white, colors.red);
    }
    onKeyDown(e: KeyboardEvent): boolean {
        if (e.keyCode === "i".charCodeAt(0) || e.keyCode === "I".charCodeAt(0)) {
            this.contextManager.toggleContext(this);
        }
        return true;
    }
}




class GameContext extends ModalContext {
    private map: Map;
    private inventorytContext: InventoryContext;

    constructor(contextManager: ContextManager) {
        super(contextManager);
        this.map = new Map(257, 257);
        player.map = this.map;
        this.inventorytContext = new InventoryContext(contextManager);
        this.regenerateMap();
    }

    regenerateMap() {
        const { width, height, flags } = this.map;
        for (let i = 0; i < width * height; ++i) {
            flags[i] = 0;
        }

        generateCave(this.map, stdGen);
        // generateIsland(this.map, stdGen);

        const playerPos = this.map.randomWalkablePos();
        if (!playerPos) {
            throw new Error("unable to pick player pos");
        }
        player.position = playerPos;
        this.updateVisible();
    }

    updateVisible() {
        this.map.resetVisible();
        fieldOfView(
            player.x, player.y, 100,
            (x, y) => {
                this.map.setFlag(x, y, CellFlag.Visible | CellFlag.Discovered);
            },
            (x, y) => !this.map.isWalkable(x, y),
        );
    }

    onDraw(display: Display): void {
        this.updateVisible();
        const corner = new Vec2(
            player.x - (display.width >>> 1),
            player.y - (display.height >>> 1),
        );
        drawMap(this.map, display, corner, new Vec2(0, 0));
    }

    onKeyDown(e: KeyboardEvent): boolean {
        if (e.keyCode === 37) { // left
            player.move(Direction.West);
        } else if (e.keyCode === 38) { // up
            player.move(Direction.North);
        } else if (e.keyCode === 39) { // right
            player.move(Direction.East);
        } else if (e.keyCode === 40) { // down
            player.move(Direction.South);
        } else if (e.keyCode === "r".charCodeAt(0) || e.keyCode === "R".charCodeAt(0)) {
            this.regenerateMap();
        } else if (e.keyCode === "i".charCodeAt(0) || e.keyCode === "I".charCodeAt(0)) {
            this.contextManager.toggleContext(this.inventorytContext);
        } else {
            return false;
        }
        return true;
    }

    onMouseMove(x: number, y: number): boolean {
        return false;
    }

    /*onMouseClick(x: number, y: number): boolean {
        const p = this.mapDrawer.canvasCoordToWorldTileCoord(e.clientX, e.clientY);
        this.mapDrawer.corner.x = p.x - ~~(0.5 * this.canvas.width / this.display.charWidth);
        this.mapDrawer.corner.y = p.y - ~~(0.5 * this.canvas.height / this.display.charHeight);
        this.display.redraw();
        return true;
    }*/
}


/*
function canvasCoordToWorldTileCoord(canvasX: number, canvasY: number): Vec2 {
    return canvasCoordToScreenTileCoord(canvasX, canvasY).add(mapDrawer.corner);
}

function canvasCoordToScreenTileCoord(canvasX: number, canvasY: number): Vec2 {
    const x = ~~(canvasX / display.charWidth);
    const y = ~~(canvasY / display.charHeight);
    return new Vec2(x, y);
}

function canvasCoordForWorldTileCoord(x: number, y: number): Vec2 {
    return new Vec2((x - mapDrawer.corner.x) * display.charWidth, (y - mapDrawer.corner.y) * display.charHeight);
}
*/


class Game {
    private canvas: HTMLCanvasElement;
    private fontImages: HTMLImageElement[];
    private display: Display;
    private contextManager: ContextManager;
    private cursorCell = new Vec2(0, 0);

    constructor() {
        document.addEventListener("contextmenu", event => event.preventDefault());
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.fontImages = [
            document.getElementById("fontImage1") as HTMLImageElement,
            document.getElementById("fontImage2") as HTMLImageElement,
        ];
        this.display = makeNullDisplay();
        this.contextManager = new ContextManager(() => this.display.redraw());
    }

    start = () => {
        Game.ensureImagesLoaded(this.fontImages, this.runGame);
    }

    private runGame = (): void => {
        this.recreateDisplay();
        window.addEventListener("resize", this.resizeCanvas);
        document.addEventListener("keydown", this.onKeyDown);
        this.canvas.addEventListener("click", this.onClick);
        document.addEventListener("mousemove", this.onMouseMove);
        document.addEventListener("touchstart", this.onTouchStart);
        this.contextManager.push(new GameContext(this.contextManager));
        this.display.redraw();
    }

    private recreateDisplay = () => {
        if (this.display) {
            this.display.destroy();
        }
        const factory = Game.readNumberSetting("forceCanvasDisplay", 0) ? makeCanvasDisplay : makeDisplay;
        this.display = factory(
            this.canvas,
            this.fontImages[Game.readNumberSetting("fontNum", 0)],
            () => this.contextManager.dispatchDraw(this.display),
        );
        this.resizeCanvas();
    }

    private resizeCanvas = () => {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.display.reshape(true);
    }

    private onKeyDown = (e: KeyboardEvent) => {
        if (e.keyCode === "c".charCodeAt(0) || e.keyCode === "C".charCodeAt(0)) {
            const forceCanvasDisplay = Game.readNumberSetting("forceCanvasDisplay", 0) ? 0 : 1;
            Game.writeNumberSetting("forceCanvasDisplay", forceCanvasDisplay);
            location.reload();
            return;
        }

        this.contextManager.dispatchKeyDown(e);

        if (e.keyCode === "f".charCodeAt(0) || e.keyCode === "F".charCodeAt(0)) {
            const fontNum = (Game.readNumberSetting("fontNum", -1) + 1) % 2;
            Game.writeNumberSetting("fontNum", fontNum);
            this.recreateDisplay();
        }

        this.display.redraw();
    }

    private onClick = (e: MouseEvent) => {
        const x = ~~(e.clientX / this.display.charWidth);
        const y = ~~(e.clientY / this.display.charHeight);
        this.contextManager.dispatchClick(x, y);
        /*const gl = (this.display as any).gl;
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

    private onMouseMove = (e: MouseEvent) => {
        const x = ~~(e.clientX / this.display.charWidth);
        const y = ~~(e.clientY / this.display.charHeight);
        const cell = new Vec2(x, y);
        if (this.cursorCell.distanceTo(cell) <= 0) {
            return;
        }
        this.cursorCell = cell;
        this.contextManager.dispatchMouseMove(x, y);
        this.display.redraw();
    }

    private onTouchStart = (e: TouchEvent) => {
        if (e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const p = new Vec2(touch.clientX, touch.clientY);
            const top = new Vec2(this.canvas.width / 2, 0);
            const bottom = new Vec2(this.canvas.width / 2, this.canvas.height);
            const left = new Vec2(0, this.canvas.height / 2);
            const right = new Vec2(this.canvas.width, this.canvas.height / 2);
            const dirs = [
                [Direction.North, p.sub(top).mag()],
                [Direction.South, p.sub(bottom).mag()],
                [Direction.West, p.sub(left).mag()],
                [Direction.East, p.sub(right).mag()],
            ];
            dirs.sort((a, b) => a[1] - b[1]);
            //console.log(p);
            //console.log(dirs[0][1]);
            player.move(dirs[0][0]);
            this.display.redraw();
        }
    }

    private static readNumberSetting(name: string, defValue: number = 0): number {
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

    private static writeNumberSetting(name: string, value: number): void {
        if (localStorage) {
            localStorage.setItem(name, value.toString(10));
        }
    }

    private static ensureImagesLoaded(images: HTMLImageElement[], onAllLoaded: () => void): void {
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
}


console.log("Starting game...");
new Game().start();
