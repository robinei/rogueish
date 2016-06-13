import { Display } from "../display";
import { Color, colors } from "../color";

export {
    UIContext,
}



class UIContext {
    private xs: number[];
    private ys: number[];
    private widths: number[];
    private heights: number[];

    constructor(public display: Display) {
        this.xs.push(0);
        this.ys.push(0);
        this.widths.push(display.width);
        this.heights.push(display.height);
    }

    get x(): number {
        return this.xs[this.xs.length - 1];
    }
    get y(): number {
        return this.ys[this.ys.length - 1];
    }
    get width(): number {
        return this.widths[this.widths.length - 1];
    }
    get height(): number {
        return this.heights[this.heights.length - 1];
    }

    push(x: number, y: number, width: number, height: number): void {
        this.xs.push(this.x + x);
        this.ys.push(this.y + y);
        this.widths.push(width);
        this.heights.push(height);
    }
    pop(): void {
        this.xs.pop();
        this.ys.pop();
        this.widths.pop();
        this.heights.pop();
    }

    put(x: number, y: number, char: number, fgcolor: Color = colors.white, bgcolor: Color = colors.black): void {
        const { char, fg, bg, width } = this.display;
        const index = (this.y + y) * width +
    }

    fill(color: Color, x: number = 0, y: number = 0, width?: number, height?: number): void {
        if (width === undefined) {
            width = this.width;
        }
        if (height === undefined) {
            height = this.height;
        }
        const { char, fg, bg } = this.display;
        const displayWidth = this.display.width;
        const x0 = this.x + x;
        const y0 = this.y + y;
        const x1 = x0 + width;
        const y1 = y0 + height;
        for (let j = y0; j < y1; ++j) {
            for (let i = x0; i < x1; ++i) {
                const index = j * displayWidth + i;
                char[index] = 0;
                fg[index] = colors.white;
                bg[index] = color;
            }
        }
    }

    text(text: string, x: number = 0, y: number = 0, color: Color = colors.white): void {
        const { char, fg, bg } = this.display;
        const displayWidth = this.display.width;
        const x0 = this.x + x;
        const y0 = this.y + y;
        for (let i = x0; i < x1; ++i) {
            const index = j * displayWidth + i;
            char[index] = 0;
            fg[index] = colors.white;
            bg[index] = color;
        }
    }
}


function test(ui: UIContext): void {
    ui.push(0, 0, 15, ui.height);
    ui.fill(colors.black);
    ui.text("Hello", 0, 0);

    ui.pop();
}

