// JavaScript implementation ported to TypeScript, taken from:
// http://www.roguebasin.com/index.php?title=Permissive_Field_of_View


/** Compute the field of view from (ox, oy) out to radius r. */
export function fieldOfView(
    ox: number,
    oy: number,
    r: number,
    visit: (x: number, y: number) => void,
    blocked: (x: number, y: number) => boolean
): void
{
    visit(ox, oy); // origin always visited.

    function quadrant(dx: number, dy: number): void {
        const light = new Light(r);
        for (let dr = 1; dr <= r; ++dr) {
            for (let i = 0; i <= dr; ++i) {
                // Check for light hitting this cell.
                const cell = new Pt(dr - i, i);
                const arci = light.hits(cell);
                if (arci < 0) {
                    continue; // unlit
                }

                // Show the lit cell, check if blocking.
                const ax = ox + cell.x * dx;
                const ay = oy + cell.y * dy;
                visit(ax, ay);
                if (!blocked(ax, ay)) {
                    continue; // unblocked
                }

                // Blocking cells cast shadows.
                if (!light.shade(arci, cell)) {
                    return; // no more light
                }
            }
        }
    }

    quadrant(-1, +1);
    quadrant(+1, +1);
    quadrant(-1, -1);
    quadrant(+1, -1);
}


/** Helper methods for points. */
class Pt {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    toString(): string { return '(' + this.x + ',' + this.y + ')'; }
    copy(): Pt { return new Pt(this.x, this.y); }
}


/** Helper methods for lines. */
class Ln {
    p: Pt;
    q: Pt;
    constructor(p: Pt, q: Pt) {
        this.p = p;
        this.q = q;
    }
    toString(): string { return this.p + '-' + this.q; }
    copy(): Ln { return new Ln(this.p.copy(), this.q.copy()); }
    cw(pt: Pt): boolean { return this.dtheta(pt) > 0; }
    ccw(pt: Pt): boolean { return this.dtheta(pt) < 0; }
    dtheta(pt: Pt): number {
        const theta = Math.atan2(this.q.y - this.p.y, this.q.x - this.p.x);
        const other = Math.atan2(pt.y - this.p.y, pt.x - this.p.x);
        const dt = other - theta;
        return (dt > -Math.PI) ? dt : (dt + 2 * Math.PI);
    }
}


/** Helper methods for arcs. */
class Arc {
    steep: Ln;
    shallow: Ln;
    steepbumps: Pt[];
    shallowbumps: Pt[];
    
    constructor(steep: Ln, shallow: Ln) {
        this.steep = steep;
        this.shallow = shallow;
        this.steepbumps = [];
        this.shallowbumps = [];
    }

    toString(): string {
        return '[' + this.steep + ' : ' + this.shallow + ']';
    }

    copy(): Arc {
        const c = new Arc(this.steep.copy(), this.shallow.copy());
        for (let i = 0; i < this.steepbumps.length; ++i) {
            c.steepbumps.push(this.steepbumps[i].copy());
        }
        for (let i = 0; i < this.shallowbumps.length; ++i) {
            c.shallowbumps.push(this.shallowbumps[i].copy());
        }
        return c;
    }

    hits(pt: Pt): boolean {
        return this.steep.ccw(new Pt(pt.x + 1, pt.y)) && this.shallow.cw(new Pt(pt.x, pt.y + 1));
    }

    /** Bump this arc clockwise (a steep bump). */
    bumpCW(pt: Pt): void {
        // Steep bump.
        const sb = new Pt(pt.x + 1, pt.y);
        this.steepbumps.push(sb);
        this.steep.q = sb;
        for (let i = 0; i < this.shallowbumps.length; ++i) {
            const b = this.shallowbumps[i];
            if (this.steep.cw(b)) {
                this.steep.p = b;
            }
        }
    }

    /** Bump this arc counterclockwise (a shallow bump). */
    bumpCCW(pt: Pt): void {
        const sb = new Pt(pt.x, pt.y + 1);
        this.shallowbumps.push(sb);
        this.shallow.q = sb;
        for (let i = 0; i < this.steepbumps.length; ++i) {
            const b = this.steepbumps[i];
            if (this.shallow.ccw(b)) {
                this.shallow.p = b;
            }
        }
    }

    shade(pt: Pt): Arc[] {
        const steepBlock = this.steep.cw(new Pt(pt.x, pt.y + 1));
        const shallowBlock = this.shallow.ccw(new Pt(pt.x + 1, pt.y));
        if (steepBlock && shallowBlock) {
            // Completely blocks this arc.
            return [];
        } else if (steepBlock) {
            // Steep bump.
            this.bumpCW(pt);
            return [this];
        } else if (shallowBlock) {
            // Shallow bump.
            this.bumpCCW(pt);
            return [this];
        } else {
            // Splits this arc in twain.
            const a = this.copy();
            const b = this.copy();
            a.bumpCW(pt);
            b.bumpCCW(pt);
            return [a, b];
        }
    }
}


/** Helper methods for a collection of arcs covering a quadrant. */
class Light {
    arcs: Arc[];
    
    constructor(radius: number) {
        const wide = new Arc(
            new Ln(new Pt(1, 0), new Pt(0, radius)),
            new Ln(new Pt(0, 1), new Pt(radius, 0))
        );
        this.arcs = [wide];
    }
    
    /** Return index of Arc that hits the point, or -1 if none do. */
    hits(pt: Pt): number {
        for (let i = 0; i < this.arcs.length; ++i) {
            if (this.arcs[i].hits(pt)) {
                return i;
            }
        }
        return -1;
    }

    shade(arci: number, pt: Pt): boolean {
        const arc = this.arcs[arci];
        // Shade the arc with this point, replace it with new arcs (or none).
        this.arcs.splice(arci, 1, ...arc.shade(pt));
        return this.arcs.length > 0;
    }
}
