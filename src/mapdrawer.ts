import { Map, CellFlag } from "./map";
import { Display } from "./display";
import { Vec2 } from "./math";
import { colors, makeColor, scaleColor, blendColors } from "./color";
import { fieldOfView } from "./fov";
import { player } from "./entity/player";


export function drawMap(map: Map, display: Display, corner: Vec2, cursorPos: Vec2): void {
    const { width, height, char, fg, bg } = display;

    const wallColor = makeColor(244, 164, 96);
    const soilColor = makeColor(64, 64, 64);

    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const cellX = x + corner.x;
            const cellY = y + corner.y;
            if (cellX < 0 || cellY < 0 || cellX >= map.width || cellY >= map.height) {
                continue;
            }

            let flags = map.getFlags(cellX, cellY);

            if ((flags & CellFlag.Discovered) === 0) { continue; }

            let charCode = 250; // centered dot
            let bgColor = colors.black;
            let fgColor = colors.white;
            if ((flags & CellFlag.Walkable) === 0) {
                if (map.isWall(cellX, cellY)) {
                    charCode = 176;
                    fgColor = wallColor;
                } else {
                    charCode = 247;
                    fgColor = soilColor;
                }
            }

            if ((flags & CellFlag.Water) !== 0) {
                charCode = 247;
                bgColor = colors.blue;
                fgColor = scaleColor(colors.blue, 0.3);
            } else {
                let t = Math.min(1.0, map.altitude[cellY * map.width + cellX] / 10);
                t = ~~(t * 10) / 10;
                bgColor = blendColors(bgColor, colors.green, t);
            }

            // if ((flags & CellFlag.Debug) !== 0) { bgColor = colors.blue; }

            if ((flags & CellFlag.Visible) === 0) {
                fgColor = scaleColor(fgColor, 0.25);
                bgColor = scaleColor(bgColor, 0.25);
            }

            const i = y * width + x;
            char[i] = charCode;
            fg[i] = fgColor;
            bg[i] = bgColor;
        }
    }

    if (cursorPos) {
        const path = map.calcPath(player.position, cursorPos);
        if (path) {
            for (let p of path) {
                const outX = p.x - corner.x;
                const outY = p.y - corner.y;
                if (outX >= 0 && outY >= 0 && outX < width && outY < height) {
                    const i = outY * width + outX;
                    char[i] = "*".charCodeAt(0);
                }
            }
        }
    }

    const playerX = player.x - corner.x;
    const playerY = player.y - corner.y;
    if (playerX >= 0 && playerY >= 0 && playerX < width && playerY < height) {
        const i = playerY * width + playerX;
        char[i] = "@".charCodeAt(0);
        fg[i] = colors.white;
    }

    fieldOfView(
        player.x, player.y, 13,
        (x, y) => {
            if (!map.isWalkable(x, y)) {
                return;
            }
            const dx = x - player.x;
            const dy = y - player.y;
            const d = Math.min(10, Math.sqrt(dx * dx + dy * dy));
            const t = (1 - (d / 10)) * 0.5;
            const outX = x - corner.x;
            const outY = y - corner.y;
            const color = makeColor(0xFF, 0xBF, 0x00);
            if (outX >= 0 && outY >= 0 && outX < width && outY < height) {
                const i = outY * width + outX;
                fg[i] = blendColors(fg[i], color, t);
                bg[i] = blendColors(bg[i], color, t);
            }
        },
        (x, y) => !map.isWalkable(x, y),
    );
}
