// adapted from: http://www.roguebasin.com/index.php?title=Cellular_Automata_Method_for_Generating_Random_Cave-Like_Levels

import { Map, CellFlag } from "../map";
import { stdGen } from "../mtrand";
import { floodFill } from "../util";

export {
    generateCave,
}


function generateCave(map: Map): void {
    const { width, height, flags } = map;
    const cellCount = width * height;

    let walls = [false];
    let nextWalls = [false];
    let reachable = [false];
    walls.length = cellCount;
    nextWalls.length = cellCount;
    reachable.length = cellCount;

    while (true) {
        doGenerate();

        for (let i = 0; i < cellCount; ++i) {
            reachable[i] = false;
        }
        const reachableCount = fillReachable();
        if (reachableCount / cellCount < 0.3) {
            continue;
        }
        for (let i = 0; i < cellCount; ++i) {
            walls[i] = !reachable[i];
        }
        break;
    }

    for (let i = 0; i < cellCount; ++i) {
        if (!walls[i]) {
            flags[i] = CellFlag.Walkable;
        }
    }


    function doGenerate() {
        for (let i = 0; i < cellCount; ++i) {
            walls[i] = stdGen.rnd() < 0.6;
        }
        for (let i = 0; i < 3; ++i) {
            iterate((x, y) => adjacentWallCount(x, y, 1) >= 5 || adjacentWallCount(x, y, 2) <= 2);
        }
        for (let i = 0; i < 2; ++i) {
            iterate((x, y) => adjacentWallCount(x, y, 1) >= 5);
        }
    }

    function iterate(rule: (x: number, y: number) => boolean): void {
        for (let y = 1; y < height - 1; ++y) {
            for (let x = 1; x < width - 1; ++x) {
                nextWalls[y * width + x] = rule(x, y);
            }
        }
        for (let x = 0; x < width; ++x) {
            nextWalls[x] = true;
            nextWalls[(height - 1) * width + x] = true;
        }
        for (let y = 0; y < height; ++y) {
            nextWalls[y * width] = true;
            nextWalls[y * width + width - 1] = true;
        }
        const temp = walls;
        walls = nextWalls;
        nextWalls = temp;
    }

    function adjacentWallCount(x: number, y: number, r: number = 1): number {
        let count = 0;
        for (let dy = -r; dy <= r; ++dy) {
            for (let dx = -r; dx <= r; ++dx) {
                if (dx === 0 && dy === 0) {
                    continue;
                }
                if (isWall(x + dx, y + dy)) {
                    ++count;
                }
            }
        }
        return count;
    }

    function isWall(x: number, y: number): boolean {
        if (x <= 0 || y <= 0 || x >= width - 1 || y >= height - 1) {
            // points outside of, and at the border of the map are considered walls
            return true;
        }
        return walls[y * width + x];
    }

    function fillReachable(): number {
        let foundStart = false;
        let startX = 0;
        let startY = 0;
        for (let tries = 0; tries < 100; ++tries) {
            startX = stdGen.intRange(0, width);
            startY = stdGen.intRange(0, height);
            if (!walls[startY * width + startX]) {
                foundStart = true;
                break;
            }
        }
        let reachableCount = 0;
        if (foundStart) {
            floodFill(
                startX, startY,
                width, height,
                (x, y) => !reachable[y * width + x] && !walls[y * width + x],
                (x, y) => {
                    reachable[y * width + x] = true;
                    ++reachableCount;
                }
            );
        }
        return reachableCount;
    }
}
