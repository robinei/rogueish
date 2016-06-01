// JavaScript implementation ported to TypeScript, taken from:
// http://www.roguebasin.com/index.php?title=Permissive_Field_of_View

export {
    spiralPathFOV as fieldOfView,
}


const MAX_RADIUS = 300;
const TABLE_DIM = 2 * MAX_RADIUS;
const QUEUE_LENGTH = 2 * TABLE_DIM;
const MAX_ANGLE =  ~~(1000000 * 2.0 * Math.PI);

// lookup tables
const minAngleTable = [0];
const maxAngleTable = [0];
const outerAngleTable = [0];
const outerAngle2Table = [0];

// reusable tables with state. zero-initialized, and returned to zero after use
const minLitTable = [0];
const maxLitTable = [0];

// reusable queue arrays
const queueX = [0];
const queueY = [0];


function calcTableIndex(x: number, y: number): number {
    return (y + MAX_RADIUS) * TABLE_DIM + (x + MAX_RADIUS);
}

function toAngle(a: number): number {
    let result = ~~(1000000 * a);
    while (result < 0) {
        result += MAX_ANGLE;
    }
    while (result > MAX_ANGLE) {
        result -= MAX_ANGLE;
    }
    return result;
}

(function() {
    queueX.length = QUEUE_LENGTH;
    queueY.length = QUEUE_LENGTH;

    minAngleTable.length = TABLE_DIM * TABLE_DIM;
    maxAngleTable.length = TABLE_DIM * TABLE_DIM;
    outerAngleTable.length = TABLE_DIM * TABLE_DIM;
    outerAngle2Table.length = TABLE_DIM * TABLE_DIM;
    minLitTable.length = TABLE_DIM * TABLE_DIM;
    maxLitTable.length = TABLE_DIM * TABLE_DIM;

    for (let y = -MAX_RADIUS; y < MAX_RADIUS; ++y) {
        for (let x = -MAX_RADIUS; x < MAX_RADIUS; ++x) {
            const tableIndex = (y + MAX_RADIUS) * TABLE_DIM + (x + MAX_RADIUS);
            minAngleTable[tableIndex] = toAngle(calcMinAngle(x, y));
            maxAngleTable[tableIndex] = toAngle(calcMaxAngle(x, y));
            outerAngleTable[tableIndex] = toAngle(calcOuterAngle(x, y));
            outerAngle2Table[tableIndex] = toAngle(calcOuterAngle2(x, y));
            minLitTable[tableIndex] = 0;
            maxLitTable[tableIndex] = 0;
        }
    }

    /** The minimum angle of the tile; that is, the angle of the smallest - angled corner. */
    function calcMinAngle(x: number, y: number): number {
        if (x === 0 && y === 0) return 0.0; // origin special case
        if (x >= 0 && y > 0) return coordAngle(x + 1, y); // first quadrant
        if (x < 0 && y >= 0) return coordAngle(x + 1, y + 1); // second quadrant
        if (x <= 0 && y < 0) return coordAngle(x, y + 1); // third quadrant
        return coordAngle(x, y); // fourth quadrant
    }

    /** The maximum angle of the tile; that is, the angle of the largest-angled corner. */
    function calcMaxAngle(x: number, y: number): number {
        if (x === 0 && y === 0) return 2.0 * Math.PI;  // origin special case
        if (x > 0 && y >= 0) return coordAngle(x, y + 1); // first quadrant
        if (x <= 0 && y > 0) return coordAngle(x, y); // second quadrant
        if (x < 0 && y <= 0) return coordAngle(x + 1, y); // third quadrant
        return coordAngle(x + 1, y + 1); // fourth quadrant
    }

    /** The angle of the outer corner of each tile: On the origin lines, the angle of the FIRST outer corner. */
    function calcOuterAngle(x: number, y: number): number {
        if (x === 0 && y === 0) return 0.0; // origin special case
        if (x >= 0 && y > 0) return coordAngle(x + 1, y + 1); // first quadrant with positive y axis
        if (x < 0 && y >= 0) return coordAngle(x, y + 1); // second quadrant with negative x axis
        if (x <= 0 && y < 0) return coordAngle(x, y); // third quadrant with negative y axis
        return coordAngle(x + 1, y); // fourth quadrant with positive x axis
    }

    /**
     * The squares on the axes (x or y == 0) have a second outer corner.
     * This function identifies the angle from the center of the origin
     * square to that corner.
     */
    function calcOuterAngle2(x: number, y: number): number {
        if (x !== 0 && y !== 0) return 0.0; // meaningless on non-axis squares
        if (x > 0) return coordAngle(x + 1, y + 1);
        if (x < 0) return coordAngle(x, y);
        if (y > 0) return coordAngle(x, y + 1);
        if (y < 0) return coordAngle(x + 1, y);
        return 0.0; // meaningless on origin
    }

    /**
     * Returns the angle that "oughta" be in the geometry grid for given
     * coordinates, if the grid went to those coordinates.
     */
    function coordAngle(x: number, y: number): number {
        return Math.atan2(y - 0.5, x - 0.5);
    }
})();



function spiralPathFOV(
    x: number,
    y: number,
    r: number,
    visit: (x: number, y: number) => void,
    blocked: (x: number, y: number) => boolean,
    arcStart: number = 0.0,
    arcEnd: number = 2.0 * Math.PI
): void {
    if (r >= MAX_RADIUS) {
        throw new Error("fov radius too large: " + r);
    }
    arcStart = toAngle(arcStart);
    arcEnd = toAngle(arcEnd);

    let queueHead = 0;
    let queueTail = 0;

    // the point of origin is always marked by the traverse.
    visit(x, y);

    // these 4 squares (in this order) are a valid "starting set" for Spiralpath traversal.
    // A valid starting set is either a clockwise or counterclockwise traversal of all
    // the points with manhattan distance 1 from the origin.
    testMark(1, 0, arcStart, arcEnd, minAngleTable[calcTableIndex(1, 0)], maxAngleTable[calcTableIndex(1, 0)]);
    testMark(0, 1, arcStart, arcEnd, minAngleTable[calcTableIndex(0, 1)], maxAngleTable[calcTableIndex(0, 1)]);
    testMark(-1, 0, arcStart, arcEnd, minAngleTable[calcTableIndex(-1, 0)], maxAngleTable[calcTableIndex(-1, 0)]);
    testMark(0, -1, arcStart, arcEnd, minAngleTable[calcTableIndex(0, -1)], maxAngleTable[calcTableIndex(0, -1)]);

    while (queueHead != queueTail) {
        // we dequeue one item and set all the particulars.  Also, we set the
        // squarelighting to zero for that tile so we know it's off the queue
        // next time we come across it.
        const curX = queueX[queueHead];
        const curY = queueY[queueHead];
        queueHead = (queueHead + 1) % QUEUE_LENGTH;

        const tableIndex = (curY + MAX_RADIUS) * TABLE_DIM + (curX + MAX_RADIUS);
        const minAngle = minAngleTable[tableIndex];
        const outerAngle = outerAngleTable[tableIndex];
        const outerAngle2 = outerAngle2Table[tableIndex];
        const maxAngle = maxAngleTable[tableIndex];
        const minLitAngle = minLitTable[tableIndex];
        const maxLitAngle = maxLitTable[tableIndex];
        minLitTable[tableIndex] = 0;
        maxLitTable[tableIndex] = 0;

        if (curX * curX + curY * curY < r * r) {
            if (arcStart > arcEnd) {
                // arc includes anomaly line
                if (minAngle >= arcStart && maxAngle >= arcStart && minAngle <= arcEnd && maxAngle <= arcEnd) {
                    continue;
                }
            } else {
                // arc does not include anomaly line
                if (maxAngle <= arcStart && minAngle >= arcEnd) {
                    continue;
                }
            }

            visit(x + curX, y + curY);

            if (!blocked(x + curX, y + curY)) {
                let child1X = 0;
                let child1Y = 0;
                if (curX == 0 && curY == 0) { child1X = curX; child1Y = curY; } // origin
                else if (curX >= 0 && curY > 0) { child1X = curX + 1; child1Y = curY; } // quadrant 1
                else if (curX < 0 && curY >= 0) { child1X = curX; child1Y = curY + 1; } // quadrant 2
                else if (curX <= 0 && curY < 0) { child1X = curX - 1; child1Y = curY; } // quadrant 3
                else { child1X = curX; child1Y = curY - 1; } // quadrant 4

                let child2X = 0;
                let child2Y = 0;
                if (curX == 0 && curY == 0) { child2X = curX; child2Y = curY; } // origin
                else if (curX >= 0 && curY > 0) { child2X = curX; child2Y = curY + 1; } // quadrant 1
                else if (curX < 0 && curY >= 0) { child2X = curX - 1; child2Y = curY; } // quadrant 2
                else if (curX <= 0 && curY < 0) { child2X = curX; child2Y = curY - 1; } // quadrant 3
                else { child2X = curX + 1; child2Y = curY; } // quadrant 4

                testMark(child1X, child1Y, minLitAngle, maxLitAngle, minAngle, outerAngle);

                if (outerAngle2 != 0.0) {
                    testMark(child2X, child2Y, minLitAngle, maxLitAngle, outerAngle, outerAngle2);

                    let child3X = 0;
                    let child3Y = 0;
                    if (curX != 0 && curY != 0) { child3X = child3Y = 0; } // non-axis
                    else if (curX > 0) { child3X = curX; child3Y = curY + 1; }
                    else if (curX < 0) { child3X = curX; child3Y = curY - 1; }
                    else if (curY > 0) { child3X = curX - 1; child3Y = curY; }
                    else if (curY < 0) { child3X = curX + 1; child3Y = curY; }
                    else { child3X = child3Y = 0; } // origin

                    testMark(child3X, child3Y, minLitAngle, maxLitAngle, outerAngle2, maxAngle);
                } else {
                    testMark(child2X, child2Y, minLitAngle, maxLitAngle, outerAngle, maxAngle);
                }
            } else if (minLitAngle == minAngle) {
                let child1X = 0;
                let child1Y = 0;
                if (curX == 0 && curY == 0) { child1X = curX; child1Y = curY; } // origin
                else if (curX >= 0 && curY > 0) { child1X = curX + 1; child1Y = curY; } // quadrant 1
                else if (curX < 0 && curY >= 0) { child1X = curX; child1Y = curY + 1; } // quadrant 2
                else if (curX <= 0 && curY < 0) { child1X = curX - 1; child1Y = curY; } // quadrant 3
                else { child1X = curX; child1Y = curY - 1; } // quadrant 4

                // cell is opaque.  We pass an infinitely-narrow ray of
                // light from its first corner to its first child if we
                // are doing corner touchup.
                mark(child1X, child1Y, minAngle, minAngle);
            }
        }
    }


    /** This adds light to a tile. Also, if a tile is not in the queue, it enqueues it. */
    function mark(x: number, y: number, min: number, max: number) {
        const tableIndex = (y + MAX_RADIUS) * TABLE_DIM + (x + MAX_RADIUS);
        let minLit = minLitTable[tableIndex];
        let maxLit = maxLitTable[tableIndex];

        if (minLit === 0 && maxLit === 0) {
            // no light -- implies not in queue, so we add it to the queue.
            queueX[queueTail] = x;
            queueY[queueTail] = y;
            queueTail = (queueTail + 1) % QUEUE_LENGTH;

            minLitTable[tableIndex] = min;
            maxLitTable[tableIndex] = max;
        } else {
            if (min < minLit) {
                minLitTable[tableIndex] = min;
            }
            if (max > maxLit) {
                maxLitTable[tableIndex] = max;
            }
        }
    }

    /**
     * The total lit angle is represented by minLitAngle, maxLitAngle.
     * minAngle and maxAngle are the minimum and maximum that can be illuminated in this operation.
     * Our task is to test and see if we can add light to the tile.
     * If any light is added, we call mark.
     */
    function testMark(x: number, y: number, minLitAngle: number, maxLitAngle: number, minAngle: number, maxAngle: number): void {
        if (minLitAngle > maxLitAngle) {
            // we're passing light along the anomaly axis. This takes
            // advantage of the grid-geometric property that no
            // less-than-total obstructions are possible.
            mark(x, y, minAngle, maxAngle);
        } else if (maxAngle < minLitAngle || minAngle > maxLitAngle) {
            // lightable area is outside the lighting.
        } else if (minAngle <= minLitAngle && maxLitAngle <= maxAngle) {
            // lightable area contains the lighting.
            mark(x, y, minLitAngle, maxLitAngle);
        } else if (minAngle >= minLitAngle && maxLitAngle >= maxAngle) {
            // lightable area contained by the lighting.
            mark(x, y, minAngle, maxAngle);
        } else if (minAngle >= minLitAngle && maxLitAngle <= maxAngle) {
            // least of lightable area overlaps greatest of lighting.
            mark(x, y, minAngle, maxLitAngle);
        } else if (minAngle <= minLitAngle && maxLitAngle >= maxAngle) {
            // greatest of lightable area overlaps least of lighting.
            mark(x, y, minLitAngle, maxAngle);
        } else { // This never happens.
            throw new Error("unexpected"); // unhandled case, not on the anomaly line.
        }
    }
}

