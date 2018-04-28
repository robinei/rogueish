import { Vec2 } from "./math";
import { dirDX, dirDY } from "./direction";
import { findPath, makeGridNodeExpander, NodeExpander } from "./pathfind";
import { shuffleArray } from "./util";
import { stdGen } from "./mtrand";


export {
    CellFlag,
    MapCell,
    Map,

    UndoStack,
    UndoContext,
    makeUndoStack,
    makeUndoContext,
};


const enum CellFlag {
    Walkable = 1,
    Visible = 2,
    Discovered = 4,
    Water = 8,
}

interface MapCell {
    flags: CellFlag;
    altitude: number;
}





interface AreaPos {
    x: number;
    y: number;
    distance: number;
}

const areaPositionsByDistance: AreaPos[] = [];
const areaPositionBuckets: AreaPos[][] = [];
const maxAreaRadius = 32;




class Map {
    flags = [0 as CellFlag];
    altitude = [0];

    private cellCount: number;
    private expandNode: NodeExpander;

    constructor(public width: number, public height: number) {
        this.cellCount = width * height;
        this.flags.length = this.cellCount;
        this.altitude.length = this.cellCount;
        for (let i = 0; i < this.cellCount; ++i) {
            this.flags[i] = 0;
            this.altitude[i] = 0;
        }
        this.expandNode = makeGridNodeExpander(false, width, height, this.isWalkable);
    }


    getCell(x: number, y: number): MapCell {
        const i = y * this.width + x;
        return {
            flags: this.flags[i],
            altitude: this.altitude[i],
        };
    }
    setCell(x: number, y: number, cell: MapCell): void {
        const i = y * this.width + x;
        this.flags[i] = cell.flags;
        this.altitude[i] = cell.altitude;
    }


    getFlags(x: number, y: number): CellFlag {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return 0;
        }
        return this.flags[y * this.width + x];
    }
    setFlags(x: number, y: number, f: CellFlag): void {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return;
        }
        this.flags[y * this.width + x] = f;
    }
    isFlagSet(x: number, y: number, f: CellFlag): boolean {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return false;
        }
        return (this.flags[y * this.width + x] & f) !== 0;
    }
    setFlag(x: number, y: number, f: CellFlag): void {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return;
        }
        this.flags[y * this.width + x] |= f;
    }
    clearFlag(x: number, y: number, f: CellFlag): void {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return;
        }
        this.flags[y * this.width + x] &= ~f;
    }

    isWalkable = (x: number, y: number): boolean => {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return false;
        }
        return (this.flags[y * this.width + x] & CellFlag.Walkable) !== 0;
    }

    isWall(x: number, y: number): boolean {
        if ((this.flags[y * this.width + x] & CellFlag.Walkable) === 0) {
            for (let dir = 0; dir < 8; ++dir) {
                const nx = x + dirDX[dir];
                const ny = y + dirDY[dir];
                if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) {
                    continue;
                }
                if ((this.flags[ny * this.width + nx] & CellFlag.Walkable) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    resetVisible(): void {
        for (let i = 0; i < this.cellCount; ++i) {
            this.flags[i] &= ~CellFlag.Visible;
        }
    }


    forNeighbours(originX: number, originY: number, radius: number, func: (cellX: number, cellY: number) => boolean): void {
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
            if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                continue;
            }
            if (!func(x, y)) {
                return;
            }
        }
    }

    forNeighboursUnbiased(originX: number, originY: number, radius: number,
                          func: (cellX: number, cellY: number) => boolean): void {
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
                if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                    continue;
                }
                if (!func(x, y)) {
                    return;
                }
            }
        }
    }

    calcDistance = (a: number, b: number): number => {
        const ax = a % this.width;
        const ay = ~~(a / this.width);

        const bx = b % this.width;
        const by = ~~(b / this.width);

        const deltaX = bx - ax;
        const deltaY = by - ay;

        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }

    calcPath(start: Vec2, goal: Vec2): Vec2[] | undefined {
        const startIndex = start.y * this.width + start.x;
        const goalIndex = goal.y * this.width + goal.x;
        const pathIndexes = findPath(this.cellCount, startIndex, goalIndex, this.calcDistance, this.expandNode);
        if (pathIndexes === undefined) {
            return undefined;
        }
        const path: Vec2[] = [];
        for (let i = 0; i < pathIndexes.length; ++i) {
            const index = pathIndexes[i];
            const x = index % this.width;
            const y = ~~(index / this.width);
            path.push(new Vec2(x, y));
        }
        return path;
    }

    randomPos(): Vec2 {
        const x = ~~(this.width * stdGen.rnd());
        const y = ~~(this.height * stdGen.rnd());
        return new Vec2(x, y);
    }

    randomWalkablePos(): Vec2 | undefined {
        for (let tries = 0; tries < 1000; ++tries) {
            const x = ~~(this.width * stdGen.rnd());
            const y = ~~(this.height * stdGen.rnd());
            if (this.isWalkable(x, y)) {
                return new Vec2(x, y);
            }
        }
        return undefined;
    }
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
                flagsDirty[i] = flagsOrig[i] !== map.getFlags(ox + x, oy + y);
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
        undo,
    };
}


function makeUndoStack(map: Map): UndoStack {
    const stack: UndoContext[] = [];

    function pushContext(ox: number, oy: number, width: number, height: number): UndoContext {
        const context = makeUndoContext(map, ox, oy, width, height);
        stack.push(context);
        return context;
    }

    function popContext() {
        const ctx = stack.pop();
        if (!ctx) {
            throw new Error("popped from empty stack");
        }
        ctx.undo();
    }

    function popAll() {
        while (stack.length > 0) {
            const ctx = stack.pop();
            if (!ctx) {
                throw new Error("popped from empty stack");
            }
            ctx.undo();
        }
    }

    return {
        pushContext,
        popContext,
        popAll,
    };
}




{
    for (let y = -maxAreaRadius; y <= maxAreaRadius; ++y) {
        for (let x = -maxAreaRadius; x <= maxAreaRadius; ++x) {
            const cx = x + 0.5;
            const cy = y + 0.5;
            areaPositionsByDistance.push({
                x: x,
                y: y,
                distance: Math.sqrt(cx * cx + cy * cy),
            });
        }
    }
    areaPositionsByDistance.sort(function(a: AreaPos, b: AreaPos) {
        return a.distance - b.distance;
    });

    let currDistance = -1;
    let currBucket: AreaPos[] | undefined = undefined;
    for (let i = 0; i < areaPositionsByDistance.length; ++i) {
        const pos = areaPositionsByDistance[i];
        const d = ~~(pos.distance);
        if (d !== currDistance) {
            if (currBucket !== undefined) {
                areaPositionBuckets.push(currBucket);
            }
            currBucket = [];
            currDistance = d;
        }
        if (currBucket === undefined) {
            throw new Error("should not happen");
        }
        currBucket.push(pos);
    }
    if (currBucket !== undefined && currBucket.length > 0) {
        areaPositionBuckets.push(currBucket);
    }
}
