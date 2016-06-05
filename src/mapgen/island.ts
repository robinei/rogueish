import { CellFlag, Map } from "../map";
import { ensureContiguous, midpointDisplacement } from "./util";
import { MersenneTwister } from "../mtrand";

export {
    generateIsland
}


const MIN_LAND_FRACTION = 0.2;
const CENTER_HEIGHT = 4;
const FRINGE_HEIGHT = -2;

function generateIsland(map: Map, gen: MersenneTwister): void {
    let dim = 16;
    while (dim + 1 < map.width || dim + 1 < map.height) {
        dim *= 2;
    }
    ++dim;

    const heightmap = [0];
    heightmap.length = dim * dim;

    const reachable = ensureContiguous(
        gen, dim, dim, MIN_LAND_FRACTION, doGenerate,
        (x, y) => heightmap[y * dim + x] > 0
    );

    // Now mark everything not reachable as sea.
    // This will eliminate caves disjoint from the one we found.
    for (let i = 0; i < dim * dim; ++i) {
        if (!reachable[i] || heightmap[i] <= 0) {
            heightmap[i] = FRINGE_HEIGHT;
        }
    }

    const xOff = (map.width - dim) / 2;
    const yOff = (map.height - dim) / 2;
    for (let y = 0; y < dim; ++y) {
        for (let x = 0; x < dim; ++x) {
            if (heightmap[dim * y + x] > 0) {
                map.setFlag(x + xOff, y + yOff, CellFlag.Walkable);
            }
        }
    }

    function doGenerate() {
        for (let i = 0; i < dim * dim; ++i) {
            heightmap[i] = Number.MAX_VALUE;
        }
        heightmap[(dim * dim) >>> 1] = CENTER_HEIGHT;
        for (let x = 0; x < dim; ++x) {
            heightmap[x] = FRINGE_HEIGHT;
            heightmap[dim * (dim - 1) + x] = FRINGE_HEIGHT;
        }
        for (let y = 0; y < dim; ++y) {
            heightmap[y * dim] = FRINGE_HEIGHT;
            heightmap[(y + 1) * dim - 1] = FRINGE_HEIGHT;
        }
        midpointDisplacement(gen, heightmap, dim);
    }
}



