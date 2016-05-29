import { CellFlag, MapCell, Map, makeMap } from "./map";
import { makeMapDrawer } from "./mapdrawer";
import { CHAR_DIM, makeDisplay } from "./display";
import { fieldOfView } from "./fov";
import { Vec2, Rect } from "./math";
import { generateMaze } from "./mapgen/maze";


interface PrefabCellSpec {
    char: string;
    wantEntrance: boolean;
}

enum PrefabCellFlag {
    IsEntrance
}

interface PrefabConf {
    getFlags(char: string): PrefabCellFlag;
    getCell(spec: PrefabCellSpec): MapCell;
}



interface Prefab {
    width: number;
    height: number;
    rows: string[];
    flags: PrefabCellFlag[];
    entrances: Vec2[];
    conf: PrefabConf;
}

function makePrefab(conf: PrefabConf, rows: string[]): Prefab {
    rows = Object.freeze(rows);

    const height = rows.length;
    if (height === 0) {
        throw new Error("expected 1 or more rows");
    }

    const width = rows[0].length;
    if (width === 0) {
        throw new Error("expected 1 or more characters in row");
    }

    const entrances: Vec2[] = [];
    const flags = [0 as PrefabCellFlag];
    flags.length = width * height;

    for (let y = 0; y < height; ++y) {
        if (rows[y].length !== width) {
            throw new Error("expected all rows to be of length: " + width);
        }
        for (let x = 0; x < width; ++x) {
            const i = y * width + x;
            flags[i] = conf.getFlags(rows[y][x]);
            if ((flags[i] & PrefabCellFlag.IsEntrance) !== 0) {
                entrances.push(new Vec2(x, y));
            }
        }
    }

    return {
        width,
        height,
        rows,
        flags,
        entrances,
        conf,
    };
}

function applyPrefab(prefab: Prefab, map: Map, ox: number, oy: number, usedEntrances: Vec2[]) {
    const spec: PrefabCellSpec = {
        wantEntrance: false,
        char: "",
    };
    const { width, height, rows, flags, conf } = prefab;
    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            spec.char = rows[y][x];
            spec.wantEntrance = false;
            if ((flags[y * width + x] & PrefabCellFlag.IsEntrance) !== 0) {
                for (let i = 0; i < usedEntrances.length; ++i) {
                    const p = usedEntrances[i];
                    if (x === p.x && y === p.y) {
                        spec.wantEntrance = true;
                        break;
                    }
                }
            }
            const cell = conf.getCell(spec);
            map.setCell(ox + x, oy + y, cell);
        }
    }
}

interface PrefabEntry {
    priority: number;
    prefab: Prefab;
}

interface AddedRoom {
    rect: Rect;
    prefab: Prefab;
    usedEntrances: Vec2[];
}

function makeDungeonGenerator(map: Map, prefabs: PrefabEntry[]) {
    prefabs.sort((a, b) => a.priority - b.priority);

    const addedRooms: AddedRoom[] = [];

    function randomPrefab(): Prefab {
        const threshold = Math.random();
        for (let i = 0; i < prefabs.length; ++i) {
            if (prefabs[i].priority >= threshold) {
                return prefabs[i].prefab;
            }
        }
        return undefined;
    }

    function addRoom(): boolean {
        const prefab = randomPrefab();
        if (!prefab) {
            return false;
        }
        let x: number = 0;
        let y: number = 0;
        if (addedRooms.length === 0) {
            // place first room in the middle of the map
            x = Math.floor((map.width - prefab.width) / 2);
            y = Math.floor((map.height - prefab.height) / 2);
        } else {
            for (let tries = 0; tries < 10; ++tries) {
                const room = addedRooms[Math.floor(Math.random() * addedRooms.length)];
                for (const p of room.prefab.entrances) {
                    const used = room.usedEntrances.some(q => p.equals(q));
                    if (used) {
                        continue;
                    }
                }
            }
        }
        return false;
    }

    function generate() {
        const targetRoomCount = Math.floor(Math.random() * 10) + 3;
        let roomCount = 0;
        while (roomCount < targetRoomCount) {
            let succeeded = false;
            for (let tries = 0; tries < 10; ++tries) {
                if (addRoom()) {
                    ++roomCount;
                    succeeded = true;
                    break;
                }
            }
            if (!succeeded) {
                break;
            }
        }
    }

    return {
        generate,
    };
}




const prefabConf: PrefabConf = {
    getFlags: char => {
        switch (char) {
        case "e":
            return PrefabCellFlag.IsEntrance;
        default:
            return 0;
        }
    },
    getCell: spec => {
        switch (spec.char) {
        case ".":
            return { flags: CellFlag.Walkable };
        case "e":
            if (spec.wantEntrance) {
                return { flags: CellFlag.Walkable };
            }
            return { flags: 0 };
        case "#":
            return { flags: 0 };
        default:
            return { flags: 0 };
        }
    },
};

const prefab0 = makePrefab(
    prefabConf,
    [
        "  ###e###  ",
        "  #.....#  ",
        "###.....###",
        "#.........#",
        "#...###...#",
        "e...###...e",
        "#...###...#",
        "#.........#",
        "###.....###",
        "  #.....#  ",
        "  ###e###  ",
    ]
);

const prefabs: PrefabEntry[] = [
    { priority: 0.5, prefab: prefab0 },
];





const map = makeMap(100, 80);
/*const generator = makeDungeonGenerator(map, prefabs);
generator.generate();

applyPrefab(prefab0, map, 1, 1, []);*/
map.forNeighbours(20, 20, 10, (x, y) => {
    map.setFlag(x, y, CellFlag.Walkable);
    return true;
});
map.forNeighbours(40, 20, 10, (x, y) => {
    map.setFlag(x, y, CellFlag.Walkable);
    return true;
});
map.clearFlag(30, 19, CellFlag.Walkable);
map.clearFlag(30, 20, CellFlag.Walkable);
generateMaze(map);


const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const display = makeDisplay(canvas, runApp, onDraw);
const mapDrawer = makeMapDrawer(map, display);
mapDrawer.pathOrigin = new Vec2(20, 20);


function onDraw() {
    mapDrawer.draw();
}

function runApp() {
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
    console.log("click");
    mapDrawer.pathOrigin = mapDrawer.cursorPos;
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
    fieldOfView(
        pos.x, pos.y, 100,
        (x, y) => {
            map.setFlag(x, y, CellFlag.Visible | CellFlag.Discovered);
        },
        (x, y) => !map.isWalkable(x, y)
    );

    display.redraw();
}
