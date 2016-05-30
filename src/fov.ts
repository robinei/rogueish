// JavaScript implementation ported to TypeScript, taken from:
// http://www.roguebasin.com/index.php?title=Permissive_Field_of_View

import { Color, colors } from "./color";

export {
    basicFOV as fieldOfView,
    strictFOV,
    basicFOV,
    permissiveFOV
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

    postprocQuadrant(1, 1, r,             r, -1, -1);
    postprocQuadrant(r, 1, dim - 1,       r,  1, -1);
    postprocQuadrant(1, r, r,       dim - 1, -1,  1);
    postprocQuadrant(r, r, dim - 1, dim - 1,  1,  1);


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
