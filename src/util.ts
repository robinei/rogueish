
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
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
}


export function floodFill(
    startX: number,
    startY: number,
    width: number,
    height: number,
    isUnvisitedMatch: (x: number, y: number) => boolean,
    visit: (x: number, y: number) => void
): void {
    if (startX < 0 || startY < 0 || startX >= width || startY >= height) {
        return;
    }
    if (!isUnvisitedMatch(startX, startY)) {
        return;
    }
    const stack = [startY * width + startX];
    while (stack.length > 0) {
        const index = stack.pop();
        const ox = index % width;
        const y = Math.floor(index / width);

        let x0 = ox;
        while (x0 > 0 && isUnvisitedMatch(x0 - 1, y)) {
            --x0;
        }

        let x1 = ox;
        while (x1 < width - 1 && isUnvisitedMatch(x1 + 1, y)) {
            ++x1;
        }

        let inNorthSegement = false;
        let inSouthSegement = false;
        for (let x = x0; x <= x1; ++x) {
            visit(x, y);

            if (y > 0) {
                if (isUnvisitedMatch(x, y - 1)) {
                    if (!inNorthSegement) {
                        stack.push((y - 1) * width + x);
                        inNorthSegement = true;
                    }
                } else {
                    inNorthSegement = false;
                }
            }

            if (y < height - 1) {
                if (isUnvisitedMatch(x, y + 1)) {
                    if (!inSouthSegement) {
                        stack.push((y + 1) * width + x);
                        inSouthSegement = true;
                    }
                } else {
                    inSouthSegement = false;
                }
            }
        }
    }
}
