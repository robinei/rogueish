import { stdGen } from "./mtrand";

export function isMobileSafari() {
    return navigator.userAgent.match(/(iPod|iPhone|iPad)/) && navigator.userAgent.match(/AppleWebKit/);
}

export function isInteger(value: any) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
}

export function getObjectName(object: any): string {
    const funcNameRegex = /function (.{1,})\(/;
    const results = (funcNameRegex).exec(object.constructor.toString());
    return (results && results.length > 1) ? results[1] : "";
}

export function toBoolean(parameter: any): boolean {
    if (parameter) {
        return true;
    }
    return false;
}

export function valueOrDefault<T>(val: T, def: T): T {
    if (val === undefined) {
        return def;
    }
    return val;
}


// only removes one value
export function removeFromArray<T>(array: T[], value: T): boolean {
    const i = array.indexOf(value);
    if (i < 0) {
        return false;
    }
    array.splice(i, 1);
    return true;
}


// Fisher-Yates
export function shuffleArray<T>(array: T[], count?: number): void {
    let currentIndex = count === undefined ? array.length : count;
    let temporaryValue: T;
    let randomIndex: number;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = ~~(stdGen.rnd() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
}


