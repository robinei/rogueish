import { Vec2 } from './math';
import { Direction, dirDX, dirDY } from './direction';
import { calcPath as doCalcPath, makeNeighbourCalc } from './pathfind';
import { shuffleArray } from './util';


export {
    CellFlag,
    Map,
    makeMap,
}


enum CellFlag {
    Walkable = 1,
    Visible = 2,
    Discovered = 4,
}


interface Map {
    width: number;
    height: number;
    flags: CellFlag[];
    
    getFlags(x: number, y: number): CellFlag;
    setFlags(x: number, y: number, f: CellFlag): void;
    isFlagSet(x: number, y: number, f: CellFlag): boolean;
    setFlag(x: number, y: number, f: CellFlag): void;
    clearFlag(x: number, y: number, f: CellFlag): void;
    
    isWalkable(x: number, y: number): boolean;
    isVisible(x: number, y: number): boolean;
    isDiscovered(x: number, y: number): boolean;
    isWall(x: number, y: number): boolean;
    
    resetVisible(): void;
    
    forNeighbours(originX: number, originY: number, radius: number, func: (cellX: number, cellY: number) => boolean): void;
    forNeighboursUnbiased(originX: number, originY: number, radius: number, func: (cellX: number, cellY: number) => boolean): void;
    
    calcPath(start: Vec2, goal: Vec2): Vec2[];
}


function makeMap(width: number, height: number): Map {
    const cellCount = width * height;
    const flags = [0 as CellFlag];
    const calcNeigh = makeNeighbourCalc(width, height);
    
    flags.length = cellCount;
    for (let i = 0; i < cellCount; ++i) {
        flags[i] = 0;
    }
    
    
    function getFlags(x: number, y: number): CellFlag {
        if (x < 0 || y < 0 || x >= width || y >= height) {
            return 0;
        }
        return flags[y * width + x];
    }
    function setFlags(x: number, y: number, f: CellFlag): void {
        if (x < 0 || y < 0 || x >= width || y >= height) {
            return;
        }
        flags[y * width + x] = f;
    }
    function isFlagSet(x: number, y: number, f: CellFlag): boolean {
        if (x < 0 || y < 0 || x >= width || y >= height) {
            return false;
        }
        return (flags[y * width + x] & f) != 0;
    }
    function setFlag(x: number, y: number, f: CellFlag): void {
        if (x < 0 || y < 0 || x >= width || y >= height) {
            return;
        }
        flags[y * width + x] |= f;
    }
    function clearFlag(x: number, y: number, f: CellFlag): void {
        if (x < 0 || y < 0 || x >= width || y >= height) {
            return;
        }
        flags[y * width + x] &= ~f;
    }
    
    
    function resetVisible(): void {
        for (let i = 0; i < cellCount; ++i) {
            flags[i] &= ~CellFlag.Visible;
        }
    }
    
    function isWall(x: number, y: number): boolean {
        if ((flags[y * width + x] & CellFlag.Walkable) === 0) {
            for (let dir = 0; dir < 8; ++dir) {
                const nx = x + dirDX[dir];
                const ny = y + dirDY[dir];
                if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
                    continue;
                }
                if ((flags[ny * width + nx] & CellFlag.Walkable) != 0) {
                    return true;
                }
            }
        }
        return false;
    }
    

    function forNeighbours(originX: number, originY: number, radius: number, func: (cellX: number, cellY: number) => boolean): void {
        if (radius > maxAreaRadius) {
            throw "too big radius";
        }
        for (let i = 0; i < areaPositionsByDistance.length; ++i) {
            const pos = areaPositionsByDistance[i];
            if (pos.distance > radius) {
                return;
            }
            const x = pos.x + originX;
            const y = pos.y + originY;
            if (x < 0 || y < 0 || x >= width || y >= height) {
                continue;
            }
            if (!func(x, y)) {
                return;
            }
        }
    }
    
    function forNeighboursUnbiased(originX: number, originY: number, radius: number, func: (cellX: number, cellY: number) => boolean): void {
        if (radius > maxAreaRadius) {
            throw "too big radius";
        }
        for (let i = 0; i < areaPositionBuckets.length; ++i) {
            const bucket = areaPositionBuckets[i];
            shuffleArray(bucket);
            for (let j = 0; j < bucket.length; ++j) {
                const pos = bucket[j];
                if (pos.distance > radius) {
                    return;
                }
                const x = pos.x + originX;
                const y = pos.y + originY;
                if (x < 0 || y < 0 || x >= width || y >= height) {
                    continue;
                }
                if (!func(x, y)) {
                    return;
                }
            }
        }
    }
    
    function distanceCalc(a: number, b: number): number {
        if ((flags[b] & CellFlag.Walkable) === 0) {
            return Number.MAX_VALUE;
        }
        
        const ax = a % width;
        const ay = Math.floor(a / width);
        
        const bx = a % width;
        const by = Math.floor(b / width);
        
        const deltaX = bx - ax;
        const deltaY = by - ay;
        
        // don't bother with sqrt since we dont use the distances for other than comparison
        return deltaX * deltaX + deltaY * deltaY;
    }
    
    function calcPath(start: Vec2, goal: Vec2): Vec2[] {
        const startIndex = start.y * width + start.x;
        const goalIndex = goal.y * width + goal.x;
        const pathIndexes = doCalcPath(cellCount, startIndex, goalIndex, distanceCalc, calcNeigh);
        if (pathIndexes === undefined) {
            return undefined;
        }
        const path: Vec2[] = [];
        for (let i = 0; i < pathIndexes.length; ++i) {
            const index = pathIndexes[i];
            const x = index % width;
            const y = Math.floor(index / width);
            path.push(new Vec2(x, y));
        }
        return path;
    }
    
    
    return {
        width,
        height,
        flags,
        getFlags,
        setFlags,
        isFlagSet,
        setFlag,
        clearFlag,
        isWalkable: (x, y) => isFlagSet(x, y, CellFlag.Walkable),
        isVisible: (x, y) => isFlagSet(x, y, CellFlag.Visible),
        isDiscovered: (x, y) => isFlagSet(x, y, CellFlag.Discovered),
        isWall,
        resetVisible,
        forNeighbours,
        forNeighboursUnbiased,
        calcPath
    };
}



interface UndoContext {
    beginRecording(): void;
    endRecording(): void;
    undo(): void;
}

interface UndoStack {
    pushContext(ox: number, oy: number, width: number, height: number): UndoContext;
    popContext(): void;
    popAll(): void;
}


function makeUndoContext(map: Map, ox: number, oy: number, width: number, height: number): UndoContext {
    let begun = false;
    let ended = false;
    const flagsOrig = [0 as CellFlag];
    const flagsDirty = [false];
    flagsOrig.length = width * height;
    flagsDirty.length = width * height;
    
    function beginRecording() {
        if (begun) {
            throw new Error("beginRecording() called twice");
        }
        begun = true;
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const i = y * width + x;
                flagsOrig[i] = map.getFlags(ox + x, oy + y);
            }
        }
    }
    
    function endRecording() {
        if (!begun) {
            throw new Error("endRecording() called before beginRecording()");
        }
        if (ended) {
            throw new Error("endRecording() called twice");
        }
        ended = true;
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const i = y * width + x;
                flagsDirty[i] = flagsOrig[i] != map.getFlags(ox + x, oy + y);
            }
        }
    }
    
    function undo() {
        if (!ended) {
            throw new Error("undo() called before endRecording()");
        }
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const i = y * width + x;
                if (flagsDirty[i]) {
                    map.setFlags(ox + x, oy + y, flagsOrig[i]);
                }
            }
        }
    }
    
    return {
        beginRecording,
        endRecording,
        undo
    };
}


function makeUndoStack(map: Map): UndoStack {
    const stack: UndoContext[] = [];
    
    function pushContext(ox: number, oy: number, width: number, height: number) {
        const context = makeUndoContext(map, ox, oy, width, height);
        stack.push(context);
        return context;
    }
    
    function popContext() {
        stack.pop().undo();
    }
    
    function popAll() {
        while (stack.length > 0) {
            stack.pop().undo();
        }
    }
    
    return {
        pushContext,
        popContext,
        popAll
    };
}




interface AreaPos {
    x: number;
    y: number;
    distance: number;
}

const areaPositionsByDistance: AreaPos[] = [];
const areaPositionBuckets: AreaPos[][] = [];
const maxAreaRadius = 32;

{
    for (let y = -maxAreaRadius; y <= maxAreaRadius; ++y) {
        for (let x = -maxAreaRadius; x <= maxAreaRadius; ++x) {
            const cx = x + 0.5;
            const cy = y + 0.5;
            areaPositionsByDistance.push({
                x: x,
                y: y,
                distance: Math.sqrt(cx*cx + cy*cy)
            });
        }
    }
    areaPositionsByDistance.sort(function(a: AreaPos, b: AreaPos) {
        return a.distance - b.distance;
    });
    
    let currDistance = -1;
    let currBucket: AreaPos[] = undefined;
    for (let i = 0; i < areaPositionsByDistance.length; ++i) {
        const pos = areaPositionsByDistance[i];
        const d = Math.floor(pos.distance);
        if (d != currDistance) {
            if (currBucket !== undefined) {
                areaPositionBuckets.push(currBucket);
            }
            currBucket = [];
            currDistance = d;
        }
        currBucket.push(pos);
    }
    if (currBucket !== undefined && currBucket.length > 0) {
        areaPositionBuckets.push(currBucket);
    }
}