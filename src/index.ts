import { CellFlag, Map, makeMap } from './map';
import { makeMapDrawer } from './mapdrawer';
import { CHAR_DIM, makeDisplay } from './display';
import { fieldOfView } from './fov';
import { toStringColor, makeColor, parseColor } from './color';
import { Vec2 } from './math';


interface PrefabCellSpec {
    char: string;
    wantEntrance: boolean;
}

interface PrefabConf {
    isEntrance(char: string): boolean;
    applyCell(map: Map, x: number, y: number, spec: PrefabCellSpec): void;
}

interface Prefab {
    conf: PrefabConf;
    rows: string[];
    width: number;
    height: number;
    entrances: Vec2[];
}

function makePrefab(conf: PrefabConf, rows: string[]): Prefab {
    rows = Object.freeze(rows);
    
    const entrances: Vec2[] = [];
    
    const height = rows.length;
    if (height === 0) {
        throw new Error('expected 1 or more rows');
    }
    
    const width = rows[0].length;
    if (width === 0) {
        throw new Error('expected 1 or more characters in row');
    }
    
    // find the entrances
    for (let y = 0; y < height; ++y) {
        if (rows[y].length != width) {
            throw new Error('expected all rows to be of length: ' + width);
        }
        for (let x = 0; x < width; ++x) {
            if (conf.isEntrance(rows[y][x])) {
                entrances.push(new Vec2(x, y));
            }
        }
    }
    
    return {
        conf,
        rows,
        width,
        height,
        entrances
    };
}


interface PrefabEntry {
    priority: number;
    prefab: Prefab;
}


function makeDungeonGenerator(map: Map, prefabs: PrefabEntry[]) {
    prefabs.sort((a, b) => a.priority - b.priority);
    
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
        generate
    };
} 




const prefabConf: PrefabConf = {
    isEntrance: char => char == 'e',
    applyCell: (map, x, y, spec) => {
        switch (spec.char) {
        case '.':
            map.setFlags(x, y, CellFlag.Walkable);
            break;
        case 'e':
            if (spec.wantEntrance) {
                map.setFlags(x, y, CellFlag.Walkable);
            } else {
                map.setFlags(x, y, 0);
            }
            break;
        case '#':
            map.setFlags(x, y, 0);
            break;
        }
    },
};

const prefab0 = makePrefab(prefabConf, [
    "  ###e###  ",
    " ##.....## ",
    "##.......##",
    "#.........#",
    "#....#....#",
    "e...###...e",
    "#....#....#",
    "#.........#",
    "##.......##",
    " ##.....## ",
    "  ###e###  ",
]);

const prefabs: PrefabEntry[] = [
    { priority: 0.5, prefab: prefab0 }
];


function applyPrefab(prefab: Prefab, map: Map, ox: number, oy: number) {
    const spec: PrefabCellSpec = {
        wantEntrance: false,
        char: ''
    };
    for (let y = 0; y < prefab.height; ++y) {
        for (let x = 0; x < prefab.width; ++x) {
            spec.char = prefab.rows[y][x];
            prefab.conf.applyCell(map, ox + x, oy + y, spec);
        }
    }
}



const map = makeMap(100, 80);
const generator = makeDungeonGenerator(map, prefabs);
//generator.generate();

applyPrefab(prefab0, map, 1, 1);
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


const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const display = makeDisplay(canvas, runApp, onDraw);
const mapDrawer = makeMapDrawer(map, display);


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

