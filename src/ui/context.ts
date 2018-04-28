import { Display } from "../display";
import { Color, colors } from "../color";

export {
    UIContext,
};


class Props {
    public x: number;
    public y: number;
    public width: number;
    public height: number;

    public clipLeft: number;
    public clipTop: number;
    public clipRight: number;
    public clipBottom: number;
}

class UIContext {
    private stack: Props[] = [];
    private top: Props;

    constructor(public display: Display) {
        const top = this.top = new Props();
        top.clipLeft = top.x = 0;
        top.clipTop = top.y = 0;
        top.clipRight = top.width = display.width;
        top.clipBottom = top.height = display.height;
    }

    push(x: number, y: number, width: number, height: number): void {
        const prevTop = this.top;
        this.stack.push(prevTop);
        const top = this.top = new Props();
        top.clipLeft = top.x = prevTop.x + x;
        top.clipTop = top.y = prevTop.y + y;
        top.width = width;
        top.height = height;
        top.clipRight = top.clipLeft + width;
        top.clipBottom = top.clipTop + height;
        if (top.clipLeft < prevTop.clipLeft) {
            top.clipLeft = prevTop.clipLeft;
        }
        if (top.clipTop < prevTop.clipTop) {
            top.clipTop = prevTop.clipTop;
        }
        if (top.clipRight > prevTop.clipRight) {
            top.clipRight = prevTop.clipRight;
        }
        if (top.clipBottom > prevTop.clipBottom) {
            top.clipBottom = prevTop.clipBottom;
        }
    }

    pop(): void {
        const top = this.stack.pop();
        if (!top) {
            throw new Error("pop on empty stack");
        }
        this.top = top;
    }

    fillTop(ch: number = 0, fgcolor: Color = colors.white, bgcolor: Color = colors.black): void {
        const top = this.top;
        this.fill(0, 0, top.width, top.height, ch, fgcolor, bgcolor);
    }

    fill(x: number, y: number, width: number, height: number,
         ch: number = 0, fgcolor: Color = colors.white, bgcolor: Color = colors.black): void {
        const top = this.top;
        const { char, fg, bg } = this.display;
        const displayWidth = this.display.width;
        let x0 = top.x + x;
        let y0 = top.y + y;
        let x1 = x0 + width;
        let y1 = y0 + height;
        if (x0 < top.clipLeft) {
            x0 = top.clipLeft;
        }
        if (y0 < top.clipTop) {
            y0 = top.clipTop;
        }
        if (x1 > top.clipRight) {
            x1 = top.clipRight;
        }
        if (y1 < top.clipBottom) {
            y1 = top.clipBottom;
        }
        for (let j = y0; j < y1; ++j) {
            for (let i = x0; i < x1; ++i) {
                const index = j * displayWidth + i;
                char[index] = ch;
                fg[index] = fgcolor;
                bg[index] = bgcolor;
            }
        }
    }

    text(x: number, y: number, text: string, fgcolor: Color = colors.white, bgcolor?: Color): void {
        const top = this.top;
        const y0 = top.y + y;
        if (y0 < top.clipTop || y0 >= top.clipBottom) {
            return;
        }
        let textIndex = 0;
        let x0 = top.x + x;
        if (x0 < top.clipLeft) {
            x0 = top.clipLeft;
            textIndex = x0 - (top.x + x);
        }
        let x1 = top.x + x + text.length;
        if (x1 >= top.clipRight) {
            x1 = top.clipRight;
        }

        const { char, fg, bg } = this.display;
        const displayWidth = this.display.width;
        for (let i = x0; i < x1; ++i, ++textIndex) {
            const index = y0 * displayWidth + i;
            char[index] = text.charCodeAt(textIndex);
            fg[index] = fgcolor;
            if (bgcolor !== undefined) {
                bg[index] = bgcolor;
            }
        }
    }

    put(x: number, y: number, ch: number, fgcolor: Color = colors.white, bgcolor: Color = colors.black): void {
        const top = this.top;
        x += top.x;
        y += top.y;
        if (x < top.clipLeft || y < top.clipTop || x >= top.clipRight || y >= top.clipBottom) {
            return;
        }
        const { char, fg, bg } = this.display;
        const displayWidth = this.display.width;
        const index = y * displayWidth + x;
        char[index] = ch;
        fg[index] = fgcolor;
        bg[index] = bgcolor;
    }
}

/*
function test(ui: UIContext): void {
    ui.push(0, 0, 15, ui.height);
    ui.fill(colors.black);
    ui.text("Hello", 0, 0);

    ui.pop();
}
*/
