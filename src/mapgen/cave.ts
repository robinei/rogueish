// adapted from: http://www.roguebasin.com/index.php?title=Cellular_Automata_Method_for_Generating_Random_Cave-Like_Levels

import { Map, CellFlag } from "../map";
import { MersenneTwister } from "../mtrand";
import { ensureContiguous } from "./util";

export {
    generateCave,
};

type IterRule = (x: number, y: number) => boolean;

function generateCave(map: Map, gen: MersenneTwister): void {
    const { width, height, flags } = map;
    const cellCount = width * height;

    let walls = [false];
    let nextWalls = [false];
    const cellRules = [0];
    walls.length = cellCount;
    nextWalls.length = cellCount;
    cellRules.length = cellCount;

    // Just write walls to both entire arrays, so that borders in particular will be considered walls.
    // Border cells will not be rewritten later.
    for (let i = 0; i < cellCount; ++i) {
        walls[i] = true;
        nextWalls[i] = true;
    }

    const reachable = ensureContiguous(
        gen, width, height, 0.2, doGenerate,
        (x, y) => !walls[y * width + x],
    );

    for (let i = 0; i < cellCount; ++i) {
        // Mark everything not reachable as walls.
        // This will eliminate caves disjoint from the one we found.
        walls[i] = !reachable[i];

        // Apply the generated cave to the actual map.
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
                walls[y * width + x] = gen.rnd() < 0.55;
            }
        }

        const fourFiveRule: IterRule = (x, y) => {
            const wall = isWall(x, y);
            const count = adjacentWallCount(x, y, 1);
            return (wall && count >= 4) || (!wall && count >= 5);
        };
        const rule1: IterRule = (x, y) => adjacentWallCount(x, y, 1) >= 5 || adjacentWallCount(x, y, 2) <= 2;
        const rule2: IterRule = (x, y) => adjacentWallCount(x, y, 1) >= 5 || adjacentWallCount(x, y, 2) <= 1;
        const rule3: IterRule = (x, y) => adjacentWallCount(x, y, 1) >= 5 || adjacentWallCount(x, y, 2) === 0;
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

        const pointsX = [0];
        const pointsY = [0];
        const pointRules = [0];
        function ruleAtPos(x: number, y: number): number {
            let ruleIndex = 0;
            let dist = Number.MAX_VALUE;
            for (let i = 0; i < pointsX.length; ++i) {
                const dx = x - pointsX[i];
                const dy = y - pointsY[i];
                const d = dx * dx + dy * dy;
                if (d < dist) {
                    ruleIndex = pointRules[i];
                    dist = d;
                }
            }
            return ruleIndex;
        }

        const superRule: IterRule = (x, y) => rules[cellRules[y * width + x]](x, y);

        const iters = gen.intRange(1, 4);
        for (let i = 0; i < iters; ++i) {
            for (let r = 0; r < 3; ++r) {
                pointsX[r] = gen.intRange(0, width);
                pointsY[r] = gen.intRange(0, height);
                pointRules[r] = gen.intRange(0, rules.length);
            }

            for (let y = 1; y < height - 1; ++y) {
                for (let x = 1; x < width - 1; ++x) {
                    cellRules[y * width + x] = ruleAtPos(x, y);
                }
            }

            const ruleiters = gen.intRange(1, 5);
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
}
