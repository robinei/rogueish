import { Direction, dirDX, dirDY } from "./direction";


export class Vec2 {
    constructor(public x: number, public y: number) { }

    equals(p: Vec2): boolean {
        if (!p) {
            return false;
        }
        return this.x === p.x && this.y === p.y;
    }

    distanceTo(p: Vec2) {
        const dx = this.x - p.x;
        const dy = this.y - p.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    direction(): Direction {
        const dx = sigNum(this.x);
        const dy = sigNum(this.y);
        for (let i = 0; i < 8; ++i) {
            if (dirDX[i] === dx && dirDY[i] === dy) {
                return i;
            }
        }
        return undefined;
    }

    sub(p: Vec2): Vec2 {
        return new Vec2(this.x - p.x, this.y - p.y);
    }

    add(p: Vec2): Vec2 {
        return new Vec2(this.x + p.x, this.y + p.y);
    }

    dirVector(dir: Direction) {
        return [dirDX[dir], dirDY[dir]];
    }

    toString(): string {
        return `Vec2(${this.x}, ${this.y})`;
    }
}


export class Rect {
    constructor(public x: number, public y: number, public width: number, public height: number) { }

    x1(): number {
        return this.x + this.width;
    }
    y1(): number {
        return this.y + this.height;
    }

    getPosition(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    intersects(r: Rect): boolean {
        return !(r.x > this.x1() ||
                    r.x1() < this.x ||
                    r.y > this.y1() ||
                    r.y1() < this.y);
    }
}


export function sigNum(num: number): number {
    if (num < 0) {
        return -1;
    }
    if (num > 0) {
        return 1;
    }
    return 0;
}


export function interpolate(a: number, b: number, t: number) {
    return a * (1 - t) + b * t;
}
