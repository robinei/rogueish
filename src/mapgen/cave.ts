// adapted from: http://www.roguebasin.com/index.php?title=Cellular_Automata_Method_for_Generating_Random_Cave-Like_Levels

import { Map, CellFlag } from "../map";
import { stdGen } from "../mtrand";
import { floodFill } from "../util";
import { Vec2 } from "../math";

export {
    generateCave,
}

type IterRule = (x: number, y: number) => boolean;

function generateCave(map: Map): void {
    const { width, height, flags } = map;
    const cellCount = width * height;

    let walls = [false];
    let nextWalls = [false];
    let reachable = [false];
    let cellRules = [0];
    walls.length = cellCount;
    nextWalls.length = cellCount;
    reachable.length = cellCount;
    cellRules.length = cellCount;

    // Just write walls to both entire arrays, so that borders in particular will be considered walls.
    // Border cells will not be rewritten later.
    for (let i = 0; i < cellCount; ++i) {
        walls[i] = true;
        nextWalls[i] = true;
    }

    while (true) {
        doGenerate();

        for (let i = 0; i < cellCount; ++i) {
            reachable[i] = false;
        }
        const reachableCount = fillReachable();
        // Regenerate if we didn't find a connected cave covering a big enough fraction of total cells.
        if (reachableCount / cellCount < 0.2) {
            continue;
        }
        // Now mark everything not reachable as walls.
        // This will eliminate caves disjoint from the one we found.
        for (let i = 0; i < cellCount; ++i) {
            walls[i] = !reachable[i];
        }
        break; // Done!
    }

    // Finally apply the generated cave to the actual map.
    for (let i = 0; i < cellCount; ++i) {
        if (!walls[i]) {
            flags[i] = CellFlag.Walkable;
        }
    }


    /**
     * Randomly generate every non-border cell,
     * then repeatedly evaluate different rule functions for nice organic cave-like structures.
     * The is will probably result in several disjoint areas.
     */
    function doGenerate() {
        for (let y = 1; y < height - 1; ++y) {
            for (let x = 1; x < width - 1; ++x) {
                walls[y * width + x] = stdGen.rnd() < 0.58;
            }
        }

        const fourFiveRule: IterRule = (x, y) => {
            const wall = isWall(x, y);
            const count = adjacentWallCount(x, y, 1);
            return (wall && count >= 4) || (!wall && count >= 5);
        };
        const rule1: IterRule = (x, y) => adjacentWallCount(x, y, 1) >= 5 || adjacentWallCount(x, y, 2) <= 2;
        const rule2: IterRule = (x, y) => adjacentWallCount(x, y, 1) >= 5 || adjacentWallCount(x, y, 2) <= 1;
        const rule3: IterRule = (x, y) => adjacentWallCount(x, y, 1) >= 5 || adjacentWallCount(x, y, 2) == 0;
        const rule4: IterRule = (x, y) => adjacentWallCount(x, y, 1) >= 5;

        const rules: IterRule[] = [
            fourFiveRule,
            fourFiveRule,
            rule1,
            rule1,
            rule2,
            rule3,
            rule4,
            rule4,
            rule4,
        ];

        let pointsX = [0];
        let pointsY = [0];
        let pointRules = [0];
        function ruleAtPos(x: number, y: number): number {
            let ruleIndex = 0;
            let dist = Number.MAX_VALUE;
            for (let i = 0; i < pointsX.length; ++i) {
                const dx = x - pointsX[i];
                const dy = y - pointsY[i];
                const d = dx * dx + dy * dy;
                if (d < dist) {
                    dist = d;
                    ruleIndex = pointRules[i];
                }
            }
            return ruleIndex;
        };

        const superRule: IterRule = (x, y) => rules[cellRules[y * width + x]](x, y);

        const iters = stdGen.intRange(1, 4);
        for (let i = 0; i < iters; ++i) {
            for (let r = 0; r < 3; ++r) {
                pointsX[r] = stdGen.intRange(0, width);
                pointsY[r] = stdGen.intRange(0, height);
                pointRules[r] = stdGen.intRange(0, rules.length);
            }

            for (let y = 1; y < height - 1; ++y) {
                for (let x = 1; x < width - 1; ++x) {
                    cellRules[y * width + x] = ruleAtPos(x, y);
                }
            }

            const ruleiters = stdGen.intRange(1, 5);
            for (let j = 0; j < ruleiters; ++j) {
                iterate(superRule);
            }
        }
    }

    /** Evaluate the rule function at for every non-border cell. */
    function iterate(rule: IterRule): void {
        for (let y = 1; y < height - 1; ++y) {
            for (let x = 1; x < width - 1; ++x) {
                nextWalls[y * width + x] = rule(x, y);
            }
        }
        const temp = walls;
        walls = nextWalls;
        nextWalls = temp;
    }

    /** Number of walls in square of giver radius around origin (not counting origin). */
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

    /**
     * Is the cell at the given coordinate a wall?
     * All points outside of, and at the border of the map are considered walls.
     */
    function isWall(x: number, y: number): boolean {
        if (x <= 0 || y <= 0 || x >= width - 1 || y >= height - 1) {
            return true;
        }
        return walls[y * width + x];
    }

    /**
     * Pick a random non-wall cell on the map, and flood fill every non-wall cell
     * reachable by 4-direction walk from there, marking them all as reachable.
     * Chances are that the cell we pick will be in the largest connected cave.
     * @returns {number} Number of reachable cells.
     */
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
