


export type Color = number;


export const makeColor = (r: number, g: number, b: number, a?: number): Color => {
    if (a === undefined) {
        a = 255;
    }
    return (r << 23) | (g << 15) | (b << 7) | (a >>> 1);
};


export const colors = {
    clear:      makeColor(0x00, 0x00, 0x00, 0x00),
    white:      makeColor(0xff, 0xff, 0xff),
    silver:     makeColor(0xc0, 0xc0, 0xc0),
    gray:       makeColor(0x80, 0x80, 0x80),
    black:      makeColor(0x00, 0x00, 0x00),
    red:        makeColor(0xff, 0x00, 0x00),
    maroon:     makeColor(0x80, 0x00, 0x00),
    yellow:     makeColor(0xff, 0xff, 0x00),
    olive:      makeColor(0x80, 0x80, 0x00),
    lime:       makeColor(0x00, 0xff, 0x00),
    green:      makeColor(0x00, 0x80, 0x00),
    aqua:       makeColor(0x00, 0xff, 0xff),
    teal:       makeColor(0x00, 0x80, 0x80),
    blue:       makeColor(0x00, 0x00, 0xff),
    navy:       makeColor(0x00, 0x00, 0x80),
    fuchsia:    makeColor(0xff, 0x00, 0xff),
    purple:     makeColor(0x80, 0x00, 0x80),
};


export const parseColor = (str: string): Color => {
    if (str.charAt(0) == '#') {
        if (str.length === 7) {
            return (parseInt(str.substr(1), 16) << 7) | 127;
        }
        throw new Error('expected 6 digit hex value: ' + str);
    }
    const color = (colors as any)[str];
    if (color !== undefined) {
        return color;
    }
    throw new Error('unknown color: ' + str);
};


export const toStringColor = (color: Color): string => {
    const a = color & 127;
    if (a == 127) {
        const str = (color >>> 7).toString(16);
        switch (str.length) {
        case 6: return '#' + str;
        case 5: return '#0' + str;
        case 4: return '#00' + str;
        case 3: return '#000' + str;
        case 2: return '#0000' + str;
        case 1: return '#00000' + str;
        case 0: return '#000000';
        }
        throw new Error('this should not happen');
    }
    const r = color >>> 23;
    const g = (color >>> 15) & 255;
    const b = (color >>> 7) & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (a/127).toFixed(3) + ')';
}


export const scaleColor = (color: Color, factor: number) => {
    const r = Math.floor((color >>> 23) * factor) & 255;
    const g = Math.floor(((color >>> 15) & 255) * factor) & 255;
    const b = Math.floor(((color >>> 7) & 255) * factor) & 255;
    const a = color & 127;
    return (r << 23) | (g << 15) | (b << 7) | a;
}


export const blendColors = (c0: Color, c1: Color, t: number) => {
    var c0r = (c0 >>> 23) / 255;
    var c0g = ((c0 >>> 15) & 255) / 255;
    var c0b = ((c0 >>> 7) & 255) / 255;
    var c0a = (c0 & 127) / 127;
    
    var c1r = (c1 >>> 23) / 255;
    var c1g = ((c1 >>> 15) & 255) / 255;
    var c1b = ((c1 >>> 7) & 255) / 255;
    var c1a = (c1 & 127) / 127;
    
    var r = Math.floor((t * c1r + (1 - t) * c0r) * 255) & 255;
    var g = Math.floor((t * c1g + (1 - t) * c0g) * 255) & 255;
    var b = Math.floor((t * c1b + (1 - t) * c0b) * 255) & 255;
    var a = Math.floor((t * c1a + (1 - t) * c0a) * 127) & 127;
    
    return (r << 23) | (g << 15) | (b << 7) | a;
}






