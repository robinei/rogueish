import { Vec2 } from './math';
import { Direction, dirDX, dirDY } from './direction';
import { calcPath, makeNeighbourCalc } from './pathfind';
import { shuffleArray } from './util';


export enum CellFlag {
    Walkable = 1,
    Visible = 2,
    Discovered = 4,
}

export class Map {
    width: number;
    height: number;
    flags: CellFlag[];
    
    private calcNeigh: (node: number, result: Array<number>) => number;
    
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.flags = new Array<CellFlag>(width * height);
        for (let i = 0; i < width * height; ++i) {
            this.flags[i] = 0;
        }
        this.calcNeigh = makeNeighbourCalc(width, height);
    }
    
    indexForPos = (p: Vec2) => {
        return p.y * this.width + p.x;
    };
    
    posForIndex = (index: number) => {
        return new Vec2(index % this.width, Math.floor(index / this.width));
    };
    
    isFlagSet = (x: number, y: number, flag: CellFlag) => {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return false;
        }
        return (this.flags[y * this.width + x] & flag) != 0;
    };
    setFlag = (x: number, y: number, flag: CellFlag) => {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return;
        }
        this.flags[y * this.width + x] |= flag;
    };
    clearFlag = (x: number, y: number, flag: CellFlag) => {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return;
        }
        this.flags[y * this.width + x] &= ~flag;
    };
    
    isWalkable = (x: number, y: number) => this.isFlagSet(x, y, CellFlag.Walkable);
    isVisible = (x: number, y: number) => this.isFlagSet(x, y, CellFlag.Visible);
    isDiscovered = (x: number, y: number) => this.isFlagSet(x, y, CellFlag.Discovered);
    
    resetVisible = () => {
        const max = this.width * this.height;
        for (let i = 0; i < max; ++i) {
            this.flags[i] &= ~CellFlag.Visible;
        }
    };
    

    forNeighbours = (originX: number, originY: number, radius: number, func: (cellX: number, cellY: number) => boolean) => {
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
    };
    
    forNeighboursUnbiased = (originX: number, originY: number, radius: number, func: (cellX: number, cellY: number) => boolean) => {
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
    };
    
    private distanceCalc = (a: number, b: number) => {
        if ((this.flags[b] & CellFlag.Walkable) == 0) {
            return Number.MAX_VALUE;
        }
        
        const ax = a % this.width;
        const ay = Math.floor(a / this.width);
        
        const bx = a % this.width;
        const by = Math.floor(b / this.width);
        
        const deltaX = bx - ax;
        const deltaY = by - ay;
        
        // don't bother with sqrt since we dont use the distances for other than comparison
        return deltaX * deltaX + deltaY * deltaY;
    };
    
    calcPath = (start: Vec2, goal: Vec2, free: boolean) => {
        const startIndex = this.indexForPos(start);
        const goalIndex = this.indexForPos(goal);
        const pathIndexes = calcPath(this.width * this.height, startIndex, goalIndex, this.distanceCalc, this.calcNeigh);
        if (pathIndexes == null) {
            return null;
        }
        const path = new Array<Vec2>();
        for (let i = 0; i < pathIndexes.length; ++i) {
            path.push(this.posForIndex(pathIndexes[i]));
        }
        return path;
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
    let currBucket: AreaPos[] = null;
    for (let i = 0; i < areaPositionsByDistance.length; ++i) {
        const pos = areaPositionsByDistance[i];
        const d = Math.floor(pos.distance);
        if (d != currDistance) {
            if (currBucket !== null) {
                areaPositionBuckets.push(currBucket);
            }
            currBucket = [];
            currDistance = d;
        }
        currBucket.push(pos);
    }
    if (currBucket !== null && currBucket.length > 0) {
        areaPositionBuckets.push(currBucket);
    }
}