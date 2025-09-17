"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeQuotes = removeQuotes;
exports.hasQuotes = hasQuotes;
exports.mayBeExpression = mayBeExpression;
exports.joinTokens = joinTokens;
exports.escapeAsRegExpSource = escapeAsRegExpSource;
/** `"ab"` => `ab`. */
function removeQuotes(text) {
    if (/^['"]/.test(text)) {
        text = text.slice(1);
    }
    if (/['"]$/.test(text)) {
        text = text.slice(0, -1);
    }
    return text;
}
/** Returns whether has been quoted. */
function hasQuotes(text) {
    return /^['"]/.test(text) && /['"]$/.test(text);
}
/** Returns whether has expression. */
function mayBeExpression(text) {
    return !hasQuotes(text) && text.includes('{');
}
/** Join several tokens to one. */
function joinTokens(tokens, string) {
    if (tokens.length === 1) {
        return tokens[0];
    }
    else {
        let type = tokens[0].type;
        let start = tokens[0].start;
        let end = tokens[tokens.length - 1].end;
        let text = string.slice(start, end);
        return {
            type,
            text,
            start,
            end,
        };
    }
}
/** Escape as regexp source text.`\.` -> `\\.` */
function escapeAsRegExpSource(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=utils.js.map