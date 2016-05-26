// JavaScript implementation ported to TypeScript, taken from:
// http://www.roguebasin.com/index.php?title=Permissive_Field_of_View


export {
    fieldOfView
}


/** Compute the field of view from (ox, oy) out to radius r. */
function fieldOfView(
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
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    constructor(x0: number, y0: number, x1: number, y1: number) {
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
    }
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
    steep: Ln;
    shallow: Ln;

    steepBumpsX: number[] = [];
    steepBumpsY: number[] = [];
    shallowBumpsX: number[] = [];
    shallowBumpsY: number[] = [];

    constructor(steep: Ln, shallow: Ln) {
        this.steep = steep;
        this.shallow = shallow;
    }

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
