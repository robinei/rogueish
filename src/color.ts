


export interface Color extends Number {
    Color: any; // arbitrary member to simulate nominal type
}


export const makeColor = (r: number, g: number, b: number, a: number = 255): Color => {
    return (((r << 24) >>> 0) | ((g << 16) | (b << 8) | a)) >>> 0 as any;
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
            return (((parseInt(str.substr(1), 16) << 8) >>> 0) | 255) >>> 0 as any;
        }
        throw new Error('expected 6 digit hex value: ' + str);
    }
    if (str.indexOf('rgba(') == 0) {
        str = str.substring(5);
        str = str.substring(0, str.length - 1);
        const parts = str.split(',');
        const r = parseInt(parts[0]);
        const g = parseInt(parts[1]);
        const b = parseInt(parts[2]);
        const a = Math.floor(parseFloat(parts[3]) * 255);
        return makeColor(r, g, b, a);
    }
    if (str.indexOf('rgb(') == 0) {
        str = str.substring(4);
        str = str.substring(0, str.length - 1);
        const parts = str.split(',');
        const r = parseInt(parts[0]);
        const g = parseInt(parts[1]);
        const b = parseInt(parts[2]);
        return makeColor(r, g, b);
    }
    const color = (colors as any)[str];
    if (color !== undefined) {
        return color;
    }
    throw new Error('unknown color: ' + str);
};


export const toStringColor = (color: Color): string => {
    
    const a = <any>color & 255;
    if (a == 255) {
        const str = (<any>color >>> 8).toString(16);
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
    const r = <any>color >>> 24;
    const g = (<any>color >>> 16) & 255;
    const b = (<any>color >>> 8) & 255;
    const aFixed = (a/255).toFixed(3);
    return `rgba(${r},${g},${b},${aFixed})`;
}


export const scaleColor = (color: Color, factor: number) => {
    const r = Math.floor((<any>color >>> 24) * factor) & 255;
    const g = Math.floor(((<any>color >>> 16) & 255) * factor) & 255;
    const b = Math.floor(((<any>color >>> 8) & 255) * factor) & 255;
    return makeColor(r, g, b, <any>color & 255);
}


export const blendColors = (c0: Color, c1: Color, t: number) => {
    var c0r = (<any>c0 >>> 24) / 255;
    var c0g = ((<any>c0 >>> 16) & 255) / 255;
    var c0b = ((<any>c0 >>> 8) & 255) / 255;
    var c0a = (<any>c0 & 255) / 255;
    
    var c1r = (<any>c1 >>> 24) / 255;
    var c1g = ((<any>c1 >>> 16) & 255) / 255;
    var c1b = ((<any>c1 >>> 8) & 255) / 255;
    var c1a = (<any>c1 & 255) / 255;
    
    var r = Math.floor((t * c1r + (1 - t) * c0r) * 255);
    var g = Math.floor((t * c1g + (1 - t) * c0g) * 255);
    var b = Math.floor((t * c1b + (1 - t) * c0b) * 255);
    var a = Math.floor((t * c1a + (1 - t) * c0a) * 255);
    
    return makeColor(r, g, b, a);
}






