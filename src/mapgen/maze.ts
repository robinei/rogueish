// adapted from http://pcg.wikidot.com/pcg-algorithm:maze

import { Map, CellFlag } from "../map";
import { stdGen } from "../mtrand";
import { shuffleArray } from "../util";

export {
    generateMaze,
}


const enum State {
    Wall,
    Empty,
    UndeterminedExposed,
    UndeterminedUnexposed,
}

/**
 * Generate a perfect maze, that is a maze with all included points connected (no isolated passages),
 * and no loops (only one path between any two points).
 *
 * @param {Map} map The map in which to generate the maze.
 * @param {number=} branchrate
 *     Zero is unbiased, positive will make branches more frequent, negative will cause long passages.
 *     This controls the position in the list chosen: positive makes the start of the list more likely,
 *     negative makes the end of the list more likely.
 *     Large negative values make the original point obvious.
 *     Try values between -10, 10.
 */
function generateMaze(map: Map, branchrate: number = 0): void {
    const { width, height, flags } = map;

    // the grid of the maze
    const field = [0 as State];
    field.length = width * height;
    for (let i = 0; i < width * height; ++i) {
        if ((flags[i] & CellFlag.Walkable) !== 0) {
            field[i] = State.Empty;
        } else {
            field[i] = State.UndeterminedUnexposed;
        }
    }

    // list of coordinates of exposed but undetermined cells.
    const frontier: number[] = [];

    const startX = stdGen.intRange(0, width);
    const startY = stdGen.intRange(0, height);
    carve(startX, startY);

    while (frontier.length > 0) {
        const pos = Math.pow(stdGen.rnd(), Math.exp(-branchrate));
        const index = ~~(pos * frontier.length);
        const choice = frontier[index];
        const x = choice % width;
        const y = ~~(choice / width);
        if (check(x, y)) {
            carve(x, y);
        } else {
            harden(x, y);
        }
        frontier.splice(index, 1);
    }

    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const i = y * width + x;
            if (field[i] === State.UndeterminedUnexposed) {
                field[i] = State.Wall;
            }
            if (field[i] === State.Empty) {
                map.setFlag(x, y, CellFlag.Walkable);
            }
        }
    }


    /**
     * Make the cell at x,y a space.
     *
     * Update the fronteer and field accordingly.
     * Note: this does not remove the current cell from frontier, it only adds new cells.
     */
    function carve(x: number, y: number): void {
        const extra: number[] = [];
        field[y * width + x] = State.Empty;
        if (x > 0) {
            const i = y * width + x - 1;
            if (field[i] === State.UndeterminedUnexposed) {
                field[i] = State.UndeterminedExposed;
                extra.push(i);
            }
        }
        if (x < width - 1) {
            const i = y * width + x + 1;
            if (field[i] === State.UndeterminedUnexposed) {
                field[i] = State.UndeterminedExposed;
                extra.push(i);
            }
        }
        if (y > 0) {
            const i = (y - 1) * width + x;
            if (field[i] === State.UndeterminedUnexposed) {
                field[i] = State.UndeterminedExposed;
                extra.push(i);
            }
        }
        if (y < height - 1) {
            const i = (y + 1) * width + x;
            if (field[i] === State.UndeterminedUnexposed) {
                field[i] = State.UndeterminedExposed;
                extra.push(i);
            }
        }
        shuffleArray(extra);
        for (const i of extra) {
            frontier.push(i);
        }
    }

    /**
     * Make the cell at x,y a wall.
     */
    function harden(x: number, y: number): void {
        field[y * width + x] = State.Wall;
    }

    /**
     * Test the cell at x,y: can this cell become a space?
     *
     * true indicates it should become a space,
     * false indicates it should become a wall.
     */
    function check(x: number, y: number, diagonals: boolean = false): boolean {
        let edgestate = 0;

        if (x > 0) {
            if (field[y * width + x - 1] === State.Empty) {
                edgestate += 1;
            }
        }
        if (x < width - 1) {
            if (field[y * width + x + 1] === State.Empty) {
                edgestate += 2;
            }
        }
        if (y > 0) {
            if (field[(y - 1) * width + x] === State.Empty) {
                edgestate += 4;
            }
        }
        if (y < height - 1) {
            if (field[(y + 1) * width + x] === State.Empty) {
                edgestate += 8;
            }
        }

        if (diagonals) {
            // diagonal walls are permitted
            return edgestate === 1 || edgestate === 2 || edgestate === 4 || edgestate === 8;
        }

        // if this would make a diagonal connecition, forbid it.
        // the following steps make the test a bit more complicated and are not necessary,
        // but without them the mazes don't look as good
        if (edgestate === 1) {
            if (x < width - 1) {
                if (y > 0) {
                    if (field[(y - 1) * width + x + 1] === State.Empty) {
                        return false;
                    }
                }
                if (y < height - 1) {
                    if (field[(y + 1) * width + x + 1] === State.Empty) {
                        return false;
                    }
                }
            }
            return true;
        }
        if (edgestate === 2) {
            if (x > 0) {
                if (y > 0) {
                    if (field[(y - 1) * width + x - 1] === State.Empty) {
                        return false;
                    }
                }
                if (y < height - 1) {
                    if (field[(y + 1) * width + x - 1] === State.Empty) {
                        return false;
                    }
                }
            }
            return true;
        }
        if (edgestate === 4) {
            if (y < height - 1) {
                if (x > 0) {
                    if (field[(y + 1) * width + x - 1] === State.Empty) {
                        return false;
                    }
                }
                if (x < width - 1) {
                    if (field[(y + 1) * width + x + 1] === State.Empty) {
                        return false;
                    }
                }
            }
            return true;
        }
        if (edgestate === 8) {
            if (y > 0) {
                if (x > 0) {
                    if (field[(y - 1) * width + x - 1] === State.Empty) {
                        return false;
                    }
                }
                if (x < width - 1) {
                    if (field[(y - 1) * width + x + 1] === State.Empty) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }
}
