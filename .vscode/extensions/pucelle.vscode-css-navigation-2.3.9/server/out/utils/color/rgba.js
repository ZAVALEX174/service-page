"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRGBA = parseRGBA;
const hex_1 = require("./hex");
/**
 * Parse RGBA? color format like:
 * `RGB(200, 200, 0)`, `RGBA(200, 200, 200, 0.5)`, `RGBA(#000, 0.5)`
 */
function parseRGBA(str) {
    // `RGB(200, 200, 0)`
    let match = str.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (match) {
        return {
            r: Number(match[1]) / 255,
            g: Number(match[2]) / 255,
            b: Number(match[3]) / 255,
            a: 1,
        };
    }
    // `RGBA(200, 200, 200, 0.5)`
    match = str.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i);
    if (match) {
        return {
            r: Number(match[1]) / 255,
            g: Number(match[2]) / 255,
            b: Number(match[3]) / 255,
            a: Number(match[4]),
        };
    }
    // `RGBA(#000, 0.5)`
    match = str.match(/^rgba\(\s*(#[0-9a-fA-F]{3,6})\s*,\s*([\d.]+)\s*\)$/i);
    if (match) {
        return { ...(0, hex_1.parseHEX)(match[1]), a: Number(match[2]) };
    }
    return null;
}
//# sourceMappingURL=rgba.js.map