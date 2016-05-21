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
): void
{
    visit(ox, oy); // origin always visited.

    function quadrant(dx: number, dy: number): void {
        const light = makeLight(r);
        for (let dr = 1; dr <= r; ++dr) {
            for (let i = 0; i <= dr; ++i) {
                // Check for light hitting this cell.
                const cellX = dr - i;
                const cellY = i;
                const arci = light.hits(cellX, cellY);
                if (arci < 0) {
                    continue; // unlit
                }

                // Show the lit cell, check if blocking.
                const ax = ox + cellX * dx;
                const ay = oy + cellY * dy;
                visit(ax, ay);
                if (!blocked(ax, ay)) {
                    continue; // unblocked
                }

                // Blocking cells cast shadows.
                if (!light.shade(arci, cellX, cellY)) {
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



interface Ln {
    copy(): Ln;
    cw(x: number, y: number): boolean;
    ccw(x: number, y: number): boolean;
    setP(x: number, y: number): void;
    setQ(x: number, y: number): void;
}

/** Helper methods for lines. */
function makeLn(px: number, py: number, qx: number, qy: number): Ln {
    function dtheta(x: number, y: number): number {
        const theta = Math.atan2(qy - py, qx - px);
        const other = Math.atan2(y - py, x - px);
        const dt = other - theta;
        return (dt > -Math.PI) ? dt : (dt + 2 * Math.PI);
    }
    return {
        copy: () => makeLn(px, py, qx, qy),
        cw: (x, y) => dtheta(x, y) > 0,
        ccw: (x, y) => dtheta(x, y) < 0,
        setP: (x, y) => {
            px = x;
            py = y;
        },
        setQ: (x, y) => {
            qx = x;
            qy = y;
        },
    };
}



interface Arc {
    pushSteepBump(x: number, y: number): void;
    pushShallowBump(x: number, y: number): void;
    copy(): Arc;
    hits(x: number, y: number): boolean;
    bumpCW(x: number, y: number): void;
    bumpCCW(x: number, y: number): void;
    shade(x: number, y: number): Arc[];
}


/** Helper methods for arcs. */
function makeArc(steep: Ln, shallow: Ln): Arc {
    const steepBumpsX: number[] = [];
    const steepBumpsY: number[] = [];
    const shallowBumpsX: number[] = [];
    const shallowBumpsY: number[] = [];

    const arc: Arc = {
        pushSteepBump,
        pushShallowBump,
        copy,
        hits,
        bumpCW,
        bumpCCW,
        shade,
    };
    
    function pushSteepBump(x: number, y: number): void {
        steepBumpsX.push(x);
        steepBumpsY.push(y);
    }
    
    function pushShallowBump(x: number, y: number): void {
        shallowBumpsX.push(x);
        shallowBumpsY.push(y);
    }

    function copy(): Arc {
        const c = makeArc(steep.copy(), shallow.copy());
        for (let i = 0; i < steepBumpsX.length; ++i) {
            c.pushSteepBump(steepBumpsX[i], steepBumpsY[i]);
        }
        for (let i = 0; i < shallowBumpsX.length; ++i) {
            c.pushShallowBump(shallowBumpsX[i], shallowBumpsY[i]);
        }
        return c;
    }

    function hits(x: number, y: number): boolean {
        return steep.ccw(x + 1, y) && shallow.cw(x, y + 1);
    }

    /** Bump this arc clockwise (a steep bump). */
    function bumpCW(x: number, y: number): void {
        // Steep bump.
        pushSteepBump(x + 1, y);
        steep.setQ(x + 1, y);
        for (let i = 0; i < shallowBumpsX.length; ++i) {
            if (steep.cw(shallowBumpsX[i], shallowBumpsY[i])) {
                steep.setP(shallowBumpsX[i], shallowBumpsY[i]);
            }
        }
    }

    /** Bump this arc counterclockwise (a shallow bump). */
    function bumpCCW(x: number, y: number): void {
        pushShallowBump(x, y + 1);
        shallow.setQ(x, y + 1);
        for (let i = 0; i < steepBumpsX.length; ++i) {
            if (shallow.ccw(steepBumpsX[i], steepBumpsY[i])) {
                shallow.setP(steepBumpsX[i], steepBumpsY[i]);
            }
        }
    }

    function shade(x: number, y: number): Arc[] {
        const steepBlock = steep.cw(x, y + 1);
        const shallowBlock = shallow.ccw(x + 1, y);
        if (steepBlock && shallowBlock) {
            // Completely blocks this arc.
            return [];
        } else if (steepBlock) {
            // Steep bump.
            bumpCW(x, y);
            return [arc];
        } else if (shallowBlock) {
            // Shallow bump.
            bumpCCW(x, y);
            return [arc];
        } else {
            // Splits this arc in twain.
            const a = copy();
            const b = copy();
            a.bumpCW(x, y);
            b.bumpCCW(x, y);
            return [a, b];
        }
    }
    
    return arc;
}


interface Light {
    hits(x: number, y: number): number;
    shade(arci: number, x: number, y: number): boolean;
}

/** Helper methods for a collection of arcs covering a quadrant. */
function makeLight(radius: number): Light {
    const wide = makeArc(makeLn(1, 0, 0, radius), makeLn(0, 1, radius, 0));
    const arcs = [wide];
    
    /** Return index of Arc that hits the point, or -1 if none do. */
    function hits(x: number, y: number): number {
        for (let i = 0; i < arcs.length; ++i) {
            if (arcs[i].hits(x, y)) {
                return i;
            }
        }
        return -1;
    }

    function shade(arci: number, x: number, y: number): boolean {
        const arc = arcs[arci];
        // Shade the arc with this point, replace it with new arcs (or none).
        arcs.splice(arci, 1, ...arc.shade(x, y));
        return arcs.length > 0;
    }
    
    return {
        hits,
        shade,
    };
}
