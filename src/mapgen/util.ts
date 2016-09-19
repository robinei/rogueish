import { MersenneTwister } from "../mtrand";

export {
    ensureContiguous,
    midpointDisplacement,
    floodFill,
}

/**
 * Repeatedly calls doGenerate until it produces a contiguous area covering at least wantedFillThreshold
 * and in which all cells satisfy isMatch. Returns boolean array where true values are in the area.
 */
function ensureContiguous(
    gen: MersenneTwister,
    width: number,
    height: number,
    wantedFillThreshold: number,
    doGenerate: () => void,
    isMatch: (x: number, y: number) => boolean
): boolean[] {
    const reachable = [false];
    const size = width * height;
    reachable.length = size;

    while (true) {
        doGenerate();

        for (let i = 0; i < size; ++i) {
            reachable[i] = false;
        }
        const reachableCount = fillReachable();
        // Regenerate if we didn't find a connected area covering a big enough fraction of total cells.
        if (reachableCount / size >= wantedFillThreshold) {
            return reachable;
        }
    }

    /**
     * Pick a random matching cell on the map, and flood fill every matching cell
     * reachable by 4-direction walk from there, marking them all as reachable.
     * Chances are that the cell we pick will be in the largest connected area.
     * @returns {number} Number of reachable cells.
     */
    function fillReachable(): number {
        let foundStart = false;
        let startX = 0;
        let startY = 0;
        for (let tries = 0; tries < 100; ++tries) {
            startX = gen.intRange(0, width);
            startY = gen.intRange(0, height);
            if (isMatch(startX, startY)) {
                foundStart = true;
                break;
            }
        }
        let reachableCount = 0;
        if (foundStart) {
            floodFill(
                startX, startY,
                width, height,
                (x, y) => !reachable[y * width + x] && isMatch(x, y),
                (x, y) => {
                    reachable[y * width + x] = true;
                    ++reachableCount;
                }
            );
        }
        return reachableCount;
    }
}




function floodFill(
    startX: number,
    startY: number,
    width: number,
    height: number,
    isUnvisitedMatch: (x: number, y: number) => boolean,
    visit: (x: number, y: number) => void
): void {
    if (startX < 0 || startY < 0 || startX >= width || startY >= height) {
        return;
    }
    if (!isUnvisitedMatch(startX, startY)) {
        return;
    }
    const stack = [startY * width + startX];
    while (stack.length > 0) {
        const index = stack.pop();
        const ox = index % width;
        const y = ~~(index / width);

        let x0 = ox;
        while (x0 > 0 && isUnvisitedMatch(x0 - 1, y)) {
            --x0;
        }

        let x1 = ox;
        while (x1 < width - 1 && isUnvisitedMatch(x1 + 1, y)) {
            ++x1;
        }

        let inNorthSegement = false;
        let inSouthSegement = false;
        for (let x = x0; x <= x1; ++x) {
            visit(x, y);

            if (y > 0) {
                if (isUnvisitedMatch(x, y - 1)) {
                    if (!inNorthSegement) {
                        stack.push((y - 1) * width + x);
                        inNorthSegement = true;
                    }
                } else {
                    inNorthSegement = false;
                }
            }

            if (y < height - 1) {
                if (isUnvisitedMatch(x, y + 1)) {
                    if (!inSouthSegement) {
                        stack.push((y + 1) * width + x);
                        inSouthSegement = true;
                    }
                } else {
                    inSouthSegement = false;
                }
            }
        }
    }
}




function midpointDisplacement(gen: MersenneTwister, map: number[], mapDim: number): void {
    let side = mapDim;
    while (side >= 3) {
        diamondStep(gen, map, mapDim, side);
        squareStep(gen, map, mapDim, side);
        side = (side >>> 1) + 1;
    }
}

function diamondStep(gen: MersenneTwister, map: number[], mapDim: number, side: number): void {
    const halfSide = side >>> 1;
    const step = side - 1;
    const maxDisplace = side * 0.1;

    for (let y = halfSide; y < mapDim; y += step) {
        for (let x = halfSide; x < mapDim; x += step) {
            const i = y * mapDim + x;
            if (map[i] === Number.MAX_VALUE) {
                const topLeft = i - halfSide - mapDim * halfSide;
                const topRight = topLeft + step;
                const bottomLeft = topLeft + mapDim * step;
                const bottomRight = bottomLeft + step;
                const displace = gen.rnd() * maxDisplace - maxDisplace * 0.5;
                map[i] = displace + (map[bottomRight] + map[bottomLeft] + map[topRight] + map[topLeft]) * 0.25;
            }
        }
    }
}

function squareStep(gen: MersenneTwister, map: number[], mapDim: number, side: number): void {
    const halfSide = side >>> 1;
    const step = side - 1;
    const maxDisplace = side * 0.1;

    for (let y = 0, even = 1; y < mapDim; y += halfSide, even = 1 - even) {
        for (let x = even * halfSide; x < mapDim; x += step) {
            const i = y * mapDim + x;
            if (map[i] === Number.MAX_VALUE) {
                let top = i - mapDim * halfSide;
                if (top < 0) {
                    top += mapDim * mapDim - mapDim;
                }
                let bottom = i + mapDim * halfSide;
                if (bottom >= mapDim * mapDim) {
                    bottom -= mapDim * mapDim - mapDim;
                }
                let left = i - halfSide;
                if ((i % mapDim) === 0) {
                    left += mapDim - 1;
                }
                let right = i + halfSide;
                if ((i % mapDim) === mapDim - 1) {
                    right -= mapDim - 1;
                }
                const displace = gen.rnd() * maxDisplace - maxDisplace * 0.5;
                map[i] = displace + (map[top] + map[bottom] + map[left] + map[right]) * 0.25;
            }
        }
    }
}
