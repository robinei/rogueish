import { Direction, dirDX, dirDY } from "./direction";


export class Vec2 {
    constructor(public x: number, public y: number) { }

    static fromDir(dir: Direction): Vec2 {
        return new Vec2(dirDX[dir], dirDY[dir]);
    }

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

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    get direction(): Direction | undefined {
        const dx = signum(this.x);
        const dy = signum(this.y);
        for (let i = 0; i < 8; ++i) {
            if (dirDX[i] === dx && dirDY[i] === dy) {
                const dir: Direction = i;
                return dir;
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

    mul(p: Vec2): Vec2 {
        return new Vec2(this.x * p.x, this.y * p.y);
    }

    div(p: Vec2): Vec2 {
        return new Vec2(this.x / p.x, this.y / p.y);
    }

    toString(): string {
        return `Vec2(${this.x}, ${this.y})`;
    }
}


export class Rect {
    constructor(public x: number, public y: number, public width: number, public height: number) { }

    get x1(): number {
        return this.x + this.width;
    }
    get y1(): number {
        return this.y + this.height;
    }

    get pos(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    intersects(r: Rect): boolean {
        return !(r.x > this.x1 ||
                 r.x1 < this.x ||
                 r.y > this.y1 ||
                 r.y1 < this.y);
    }
}


export function signum(num: number): number {
    return num ? num < 0 ? -1 : 1 : 0;
}


export function interpolate(a: number, b: number, t: number) {
    return a * (1 - t) + b * t;
}
