// JavaScript implementation ported to TypeScript, taken from:
// http://www.roguebasin.com/index.php?title=Permissive_Field_of_View

import { Color, colors } from "./color";

export {
    spiralPathFOV as fieldOfView,
    strictFOV,
    basicFOV,
    permissiveFOV,
    spiralPathFOV,
}



/* cachedAngles stores the angle from the center of the origin square or
(0.5,0.5) to the corner of the tile at the given coordinates (to
the true (0,0) corner in the case of the origin square. From these
we derive all corner coordinates we need for all tiles.  This has
the benefit of avoiding repeating potentially-slow trig operations,
but it's mainly for consistency.

Since we're using a lot of doubles, and we need particular angles
that we get to in several different ways, deriving all angles in an
absolutely consistent way from this grid ensures that equality
tests are meaningful and do what we want, despite possible roundoff
errors and peculiarities of implementation.

In principle this could use Integers instead of doubles, given a
monotonic mapping of integers to angles occurring in the grid. */
const cachedAngles = [0];
const cachedAngleRadius = 300;
cachedAngles.length = cachedAngleRadius * cachedAngleRadius;

/* Initializes the cachedAngles array. It is never altered after initialization. */
{
    for (let y = 0; y < cachedAngleRadius; ++y) {
        for (let x = 0; x < cachedAngleRadius; ++x) {
            // this is the angle from the center of the 0,0 square to the
            // closest-to-origin corner of each square.  All angles except
            // the angles to the squares in the zero row/column will be in
            // the range 0 to pi/2.
            cachedAngles[y * cachedAngleRadius + x] = angleNorm(Math.atan2(y - 0.5, x - 0.5));
        }
    }
}

/**
 * returns the angle that "oughta" be in the geometry grid for given
 * coordinates, if the grid went to those coordinates.
 */
function coordAngle(x: number, y: number): number {
    if (x >= 0) {
        if (x < cachedAngleRadius) {
            if (y >= 0) {
                if (y < cachedAngleRadius) {
                    return cachedAngles[y * cachedAngleRadius + x];
                }
            } else if (y > -cachedAngleRadius) {
                return 2.0 * Math.PI - cachedAngles[(1 - y) * cachedAngleRadius + x];
            }
        }
    } else if (x > -cachedAngleRadius) {
        if (y > 0) {
            if (y < cachedAngleRadius) {
                return Math.PI - cachedAngles[y * cachedAngleRadius + (1 - x)];
            }
        } else if (y > -cachedAngleRadius) {
            return Math.PI + cachedAngles[(1 - y) * cachedAngleRadius + (1 - x)];
        }
    }
    // if it's outside of the precomputed zone and its rotations about
    // the origin, then calculate it directly.
    return angleNorm(Math.atan2(y - 0.5, x - 0.5));
}

/** normalizes angles to between zero and 2pi. */
function angleNorm(angle: number): number {
    while (angle < 0.0) {
        angle += 2.0 * Math.PI;
    }
    while (angle > 2 * Math.PI) {
        angle -= 2.0 * Math.PI;
    }
    return angle;
}

/** The minimum angle of the tile; that is, the angle of the smallest - angled corner. */
function calcMinAngle(x: number, y: number): number {
    if (x == 0 && y == 0) return 0.0; /* origin special case */
    if (x >= 0 && y > 0) return coordAngle(x + 1, y); /* first quadrant */
    if (x < 0 && y >= 0) return coordAngle(x + 1, y + 1); /* second quadrant*/
    if (x <= 0 && y < 0) return coordAngle(x, y + 1); /* third quadrant */
    return coordAngle(x, y); /* fourth quadrant */
}

/** The maximum angle of the tile; that is, the angle of the largest-angled corner. */
function calcMaxAngle(x: number, y: number): number {
    if (x == 0 && y == 0) return 2.0 * Math.PI;  /* origin special case */
    if (x > 0 && y >= 0) return coordAngle(x, y + 1); /* first quadrant */
    if (x <= 0 && y > 0) return coordAngle(x, y); /* second quadrant */
    if (x < 0 && y <= 0) return coordAngle(x + 1, y);/* third quadrant */
    return coordAngle(x + 1, y + 1); /* fourth quadrant */
}

/** The angle of the outer corner of each tile: On the origin lines, the angle of the FIRST outer corner. */
function calcOuterAngle(x: number, y: number): number {
    if (x == 0 && y == 0) return 0.0; /* origin special case */
    if (x >= 0 && y > 0) return coordAngle(x + 1, y + 1); /* first quadrant with positive y axis*/
    if (x < 0 && y >= 0) return coordAngle(x, y + 1); /* second quadrant with negative x axis*/
    if (x <= 0 && y < 0) return coordAngle(x, y); /* third quadrant with negative y axis */
    return coordAngle(x + 1, y); /* fourth quadrant with positive x axis */
}

/**
 * The squares on the axes (x or y == 0) have a second outer corner.
 * This function identifies the angle from the center of the origin
 * square to that corner.
 */
function calcOuterAngle2(x: number, y: number): number {
    if (x != 0 && y != 0) return 0.0; /* meaningless on non-axis squares */
    if (x > 0) return coordAngle(x + 1, y + 1);
    if (x < 0) return coordAngle(x, y);
    if (y > 0) return coordAngle(x, y + 1);
    if (y < 0) return coordAngle(x + 1, y);
    return 0.0; /* meaningless on origin */
}

/** true iff a given square could pass any light inside a desired arc. */
function inArc(x: number, y: number, arcstart: number, arcend: number): boolean {
    if (arcstart > arcend) {
        // arc includes anomaly line
        return calcMinAngle(x, y) < arcstart ||
            calcMaxAngle(x, y) < arcstart ||
            calcMinAngle(x, y) > arcend ||
            calcMaxAngle(x, y) > arcend;
    } else {
        // arc does not include anomaly line
        return calcMaxAngle(x, y) > arcstart || calcMinAngle(x, y) < arcend;
    }
}


function spiralPathFOV(
    x: number,
    y: number,
    r: number,
    visit: (x: number, y: number) => void,
    blocked: (x: number, y: number) => boolean,
    arcstart: number = 0.0,
    arcend: number = 2.0 * Math.PI
): void {
    /* These arrays stores the minimum and maximum lit angles of each square
    within the sight radius.  Unlit squares are represented as 0,0.
    each FOV operation must begin and end with minlit and maxlit angles
    set equal to zero. These angles change during the
    operation; if either (or both) are nonzero, then the corresponding
    element is in the queue. Angles related to each (xy) square are
    stored in at coordinates (x - sightradius, y - sightradius) because C doesn't
    allow non-zerobased arrays. */
    const minlitGrid = [0];
    const maxlitGrid = [0];
    const litGridDim = 2 * r;
    minlitGrid.length = litGridDim * litGridDim;
    maxlitGrid.length = litGridDim * litGridDim;
    for (let i = 0; i < litGridDim * litGridDim; ++i) {
        minlitGrid[i] = 0;
        maxlitGrid[i] = 0;
    }

    // The next 5 variables are a Queue of X Y coordinates.
    const queueLength = 2 * 2 * r;
    const queueX = [0];
    const queueY = [0];
    let queueHead = 0;
    let queueTail = 0;
    queueX.length = queueLength;
    queueY.length = queueLength;

    // the point of origin is always marked by the traverse.
    visit(x, y);

    // these 4 squares (in this order) are a valid "starting set" for Spiralpath traversal.
    // A valid starting set is either a clockwise or counterclockwise traversal of all
    // the points with manhattan distance 1 from the origin.
    testMark(1, 0, arcstart, arcend, calcMinAngle(1, 0), calcMaxAngle(1, 0));
    testMark(0, 1, arcstart, arcend, calcMinAngle(0, 1), calcMaxAngle(0, 1));
    testMark(-1, 0, arcstart, arcend, calcMinAngle(-1, 0), calcMaxAngle(-1, 0));
    testMark(0, -1, arcstart, arcend, calcMinAngle(0, -1), calcMaxAngle(0, -1));

    while (queueHead != queueTail) {
        // we dequeue one item and set all the particulars.  Also, we set the
        // squarelighting to zero for that tile so we know it's off the queue
        // next time we come across it.
        const curX = queueX[queueHead];
        const curY = queueY[queueHead];
        queueHead = (queueHead + 1) % queueLength;

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

        let child3X = 0;
        let child3Y = 0;
        if (curX != 0 && curY != 0) { child3X = child3Y = 0; } // non-axis
        else if (curX > 0) { child3X = curX; child3Y = curY + 1; }
        else if (curX < 0) { child3X = curX; child3Y = curY - 1; }
        else if (curY > 0) { child3X = curX - 1; child3Y = curY; }
        else if (curY < 0) { child3X = curX + 1; child3Y = curY; }
        else { child3X = 0; child3Y = 0; } // origin

        const minAngle = calcMinAngle(curX, curY);
        const outerAngle = calcOuterAngle(curX, curY);
        const outerAngle2 = calcOuterAngle2(curX, curY);
        const maxAngle = calcMaxAngle(curX, curY);

        const i = (curY + r) * litGridDim + (curX + r);
        const minLitAngle = minlitGrid[i];
        const maxLitAngle = maxlitGrid[i];

        if (curX * curX + curY * curY <= r * r && inArc(curX, curY, arcstart, arcend)) {
            visit(x + curX, y + curY);
            if (!blocked(x + curX, y + curY)) {
                testMark(child1X, child1Y, minLitAngle, maxLitAngle, minAngle, outerAngle);
                if (outerAngle2 != 0.0) {
                    testMark(child2X, child2Y, minLitAngle, maxLitAngle, outerAngle, outerAngle2);
                    testMark(child3X, child3Y, minLitAngle, maxLitAngle, outerAngle2, maxAngle);
                } else {
                    testMark(child2X, child2Y, minLitAngle, maxLitAngle, outerAngle, maxAngle);
                }
            } else {
                // cell is opaque.  We pass an infinitely-narrow ray of
                // light from its first corner to its first child if we
                // are doing corner touchup.
                if (minLitAngle == minAngle) {
                    mark(child1X, child1Y, minAngle, minAngle);
                }
            }
        }
    }


    /** This adds light to a tile. Also, if a tile is not in the queue, it enqueues it. */
    function mark(x: number, y: number, min: number, max: number) {
        const i = (y + r) * litGridDim + (x + r);
        let minlit = minlitGrid[i];
        let maxlit = maxlitGrid[i];

        if (minlit === maxlit && maxlit === 0) {
            // no light -- implies not in queue, so we add it to the queue.
            queueX[queueTail] = x;
            queueY[queueTail] = y;
            queueTail = (queueTail + 1) % queueLength;

            minlitGrid[i] = min;
            maxlitGrid[i] = max;
        } else {
            if (min < minlit) {
                minlitGrid[i] = min;
            }
            if (max > maxlit) {
                maxlitGrid[i] = max;
            }
        }
    }

    /**
     * The total lit angle is represented by minLitAngle, maxLitAngle.
     * minangle and maxangle are the minimum and maximum that can be illuminated in this operation.
     * Our task is to test and see if we can add light to the tile.
     * If any light is added, we call mark.
     */
    function testMark(x: number, y: number, minLitAngle: number, maxLitAngle: number, minangle: number, maxangle: number): void {
        if (minLitAngle > maxLitAngle) {
            // we're passing light along the anomaly axis. This takes
            // advantage of the grid-geometric property that no
            // less-than-total obstructions are possible.
            mark(x, y, minangle, maxangle);
        }
        if (maxangle < minLitAngle || minangle > maxLitAngle) {
            // lightable area is outside the lighting.
            return;
        }
        if (minangle <= minLitAngle && maxLitAngle <= maxangle) {
            // lightable area contains the lighting.
            mark(x, y, minLitAngle, maxLitAngle);
        } else if (minangle >= minLitAngle && maxLitAngle >= maxangle) {
            // lightable area contained by the lighting.
            mark(x, y, minangle, maxangle);
        } else if (minangle >= minLitAngle && maxLitAngle <= maxangle) {
            // least of lightable area overlaps greatest of lighting.
            mark(x, y, minangle, maxLitAngle);
        } else if (minangle <= minLitAngle && maxLitAngle >= maxangle) {
            // greatest of lightable area overlaps least of lighting.
            mark(x, y, minLitAngle, maxangle);
        } else { // This never happens.
            throw new Error("unexpected"); // unhandled case, not on the anomaly line.
        }
    }
}





















function strictFOV(
    x: number,
    y: number,
    r: number,
    visit: (x: number, y: number) => void,
    blocked: (x: number, y: number) => boolean
): void {
    // iterate out of map bounds as well
    for (let i = -r; i <= r; i++) {
        for (let j = -r; j <= r; j++) {
            if (i * i + j * j < r * r) {
                los(x, y, x + i, y + j);
            }
        }
    }

    function los(x0: number, y0: number, x1: number, y1: number): void {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        // sx and sy are switches that enable us to compute the LOS in a single quarter of x/y plan
        let xnext = x0;
        let ynext = y0;
        const denom = Math.sqrt(dx * dx + dy * dy);
        while (xnext !== x1 || ynext !== y1) {
            // check map bounds here if needed
            if (blocked(xnext, ynext)) { // or any equivalent
                visit(xnext, ynext); // obstructiong wall
                return;
            }
            // Line-to-point distance formula < 0.5
            if (Math.abs(dy * (xnext - x0 + sx) - dx * (ynext - y0)) / denom < 0.5) {
                xnext += sx;
            } else if (Math.abs(dy * (xnext - x0) - dx * (ynext - y0 + sy)) / denom < 0.5) {
                ynext += sy;
            } else {
                xnext += sx;
                ynext += sy;
            }
        }
        visit(x1, y1); // lit
    }
}


function basicFOV(
    ox: number,
    oy: number,
    r: number,
    visit: (x: number, y: number) => void,
    blocked: (x: number, y: number) => boolean,
    postprocAdd?: (x: number, y: number) => void
): void {
    const dim = 2 * r + 1;
    ox -= r;
    oy -= r;

    const visited = [false];
    visited.length = dim * dim;
    for (let i = 0; i < dim * dim; ++i) {
        visited[i] = false;
    }

    for (let x = 0; x < dim; ++x) {
        traceLine(x, 0);
        traceLine(x, dim - 1);
    }

    for (let y = 0; y < dim; ++y) {
        traceLine(0, y);
        traceLine(dim - 1, y);
    }

    postprocQuadrant(1, 1, r, r, -1, -1);
    postprocQuadrant(r, 1, dim - 1, r, 1, -1);
    postprocQuadrant(1, r, r, dim - 1, -1, 1);
    postprocQuadrant(r, r, dim - 1, dim - 1, 1, 1);


    function postprocQuadrant(x0: number, y0: number, x1: number, y1: number, dx: number, dy: number) {
        for (let y = y0; y < y1; ++y) {
            for (let x = x0; x < x1; ++x) {
                if (visited[y * dim + x] && !blocked(ox + x, oy + y)) {
                    if (!visited[(y + dy) * dim + x + dx] && blocked(ox + x + dx, oy + y + dy)) {
                        visited[(y + dy) * dim + x + dx] = true;
                        visit(ox + x + dx, oy + y + dy);
                        if (postprocAdd) {
                            postprocAdd(ox + x + dx, oy + y + dy);
                        }
                    }
                    if (!visited[(y + dy) * dim + x] && blocked(ox + x, oy + y + dy)) {
                        visited[(y + dy) * dim + x] = true;
                        visit(ox + x, oy + y + dy);
                        if (postprocAdd) {
                            postprocAdd(ox + x, oy + y + dy);
                        }
                    }
                    if (!visited[y * dim + x + dx] && blocked(ox + x + dx, oy + y)) {
                        visited[y * dim + x + dx] = true;
                        visit(ox + x + dx, oy + y);
                        if (postprocAdd) {
                            postprocAdd(ox + x + dx, oy + y);
                        }
                    }
                }
            }
        }
    }

    function traceLine(x1: number, y1: number): void {
        const x0 = r;
        const y0 = r;
        const deltaX = x1 - x0;
        const deltaY = y1 - y0;
        const dx = deltaX < 0 ? -1 : 1;
        const dy = deltaY < 0 ? -1 : 1;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            let error = -0.5;
            const deltaError = Math.abs(deltaY / deltaX);
            let x = x0;
            let y = y0;
            while (true) {
                if (!visited[y * dim + x]) {
                    visited[y * dim + x] = true;
                    visit(ox + x, oy + y);
                }
                if (x == x1 || blocked(ox + x, oy + y)) {
                    break;
                }
                x += dx;
                error += deltaError;
                if (error >= 0) {
                    y += dy;
                    error -= 1;
                }
            }
        } else {
            let error = -0.5;
            const deltaError = Math.abs(deltaX / deltaY);
            let x = x0;
            let y = y0;
            while (true) {
                if (!visited[y * dim + x]) {
                    visited[y * dim + x] = true;
                    visit(ox + x, oy + y);
                }
                if (y == y1 || blocked(ox + x, oy + y)) {
                    break;
                }
                y += dy;
                error += deltaError;
                if (error >= 0) {
                    x += dx;
                    error -= 1;
                }
            }
        }
    }
}




/** Compute the field of view from (ox, oy) out to radius r. */
function permissiveFOV(
    ox: number,
    oy: number,
    r: number,
    visit: (x: number, y: number) => void,
    blocked: (x: number, y: number) => boolean
): void {
    visit(ox, oy); // origin always visited.

    function quadrant(dx: number, dy: number, skipX: number, skipY: number): void {
        const arcs = [new Arc(new Ln(1, 0, 0, r), new Ln(0, 1, r, 0))];

        for (let dr = 1; dr <= r; ++dr) {
            for (let i = 0; i <= dr; ++i) {
                // Check for light hitting this cell.
                const cellX = dr - i;
                const cellY = i;

                // Find index of Arc that hits the point, or continue if none do.
                let arci = 0;
                for (; arci < arcs.length; ++arci) {
                    if (arcs[arci].hits(cellX, cellY)) {
                        break;
                    }
                }
                if (arci === arcs.length) {
                    continue; // unlit
                }

                // Show the lit cell, check if blocking.
                const ax = ox + cellX * dx;
                const ay = oy + cellY * dy;
                if (ax !== skipX && ay !== skipY) {
                    visit(ax, ay);
                }
                if (!blocked(ax, ay)) {
                    continue; // unblocked
                }

                // Blocking cells cast shadows.
                // Shade the arc with this point, replace it with new arcs (or none).
                arcs.splice(arci, 1, ...arcs[arci].shade(cellX, cellY));
                if (arcs.length === 0) {
                    return; // no more light
                }
            }
        }
    }

    quadrant(-1, +1, -1, -1);
    quadrant(+1, +1, ox, -1);
    quadrant(-1, -1, -1, oy);
    quadrant(+1, -1, ox, oy);
}



/** Helper methods for lines. */
class Ln {
    constructor(public x0: number, public y0: number, public x1: number, public y1: number) { }
    copy(): Ln { return new Ln(this.x0, this.y0, this.x1, this.y1); }
    cw(x: number, y: number): boolean { return this.dtheta(x, y) > 0; }
    ccw(x: number, y: number): boolean { return this.dtheta(x, y) < 0; }
    dtheta(x: number, y: number): number {
        const theta = Math.atan2(this.y1 - this.y0, this.x1 - this.x0);
        const other = Math.atan2(y - this.y0, x - this.x0);
        const dt = other - theta;
        return (dt > -Math.PI) ? dt : (dt + 2 * Math.PI);
    }
}



/** Helper methods for arcs. */
class Arc {
    steepBumpsX: number[] = [];
    steepBumpsY: number[] = [];
    shallowBumpsX: number[] = [];
    shallowBumpsY: number[] = [];

    constructor(public steep: Ln, public shallow: Ln) { }

    copy(): Arc {
        const c = new Arc(this.steep.copy(), this.shallow.copy());
        for (let i = 0; i < this.steepBumpsX.length; ++i) {
            c.steepBumpsX.push(this.steepBumpsX[i]);
            c.steepBumpsY.push(this.steepBumpsY[i]);
        }
        for (let i = 0; i < this.shallowBumpsX.length; ++i) {
            c.shallowBumpsX.push(this.shallowBumpsX[i]);
            c.shallowBumpsY.push(this.shallowBumpsY[i]);
        }
        return c;
    }

    hits(x: number, y: number): boolean {
        return this.steep.ccw(x + 1, y) && this.shallow.cw(x, y + 1);
    }

    /** Bump this arc clockwise (a steep bump). */
    bumpCW(x: number, y: number): void {
        // Steep bump.
        this.steepBumpsX.push(x + 1);
        this.steepBumpsY.push(y);
        this.steep.x1 = x + 1;
        this.steep.y1 = y;
        for (let i = 0; i < this.shallowBumpsX.length; ++i) {
            if (this.steep.cw(this.shallowBumpsX[i], this.shallowBumpsY[i])) {
                this.steep.x0 = this.shallowBumpsX[i];
                this.steep.y0 = this.shallowBumpsY[i];
            }
        }
    }

    /** Bump this arc counterclockwise (a shallow bump). */
    bumpCCW(x: number, y: number): void {
        this.shallowBumpsX.push(x);
        this.shallowBumpsY.push(y + 1);
        this.shallow.x1 = x;
        this.shallow.y1 = y + 1;
        for (let i = 0; i < this.steepBumpsX.length; ++i) {
            if (this.shallow.ccw(this.steepBumpsX[i], this.steepBumpsY[i])) {
                this.shallow.x0 = this.steepBumpsX[i];
                this.shallow.y0 = this.steepBumpsY[i];
            }
        }
    }

    shade(x: number, y: number): Arc[] {
        const steepBlock = this.steep.cw(x, y + 1);
        const shallowBlock = this.shallow.ccw(x + 1, y);
        if (steepBlock && shallowBlock) {
            // Completely blocks this arc.
            return [];
        } else if (steepBlock) {
            // Steep bump.
            this.bumpCW(x, y);
            return [this];
        } else if (shallowBlock) {
            // Shallow bump.
            this.bumpCCW(x, y);
            return [this];
        } else {
            // Splits this arc in twain.
            const a = this.copy();
            const b = this.copy();
            a.bumpCW(x, y);
            b.bumpCCW(x, y);
            return [a, b];
        }
    }
}
