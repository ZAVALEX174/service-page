"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSSelectorTokenScanner = exports.CSSSelectorTokenType = void 0;
const language_ids_1 = require("../language-ids");
const any_1 = require("./any");
/** CSS token type. */
var CSSSelectorTokenType;
(function (CSSSelectorTokenType) {
    /** Include `.` identifier. */
    CSSSelectorTokenType[CSSSelectorTokenType["Class"] = 0] = "Class";
    /** Include `#` identifier. */
    CSSSelectorTokenType[CSSSelectorTokenType["Id"] = 1] = "Id";
    CSSSelectorTokenType[CSSSelectorTokenType["Tag"] = 2] = "Tag";
    CSSSelectorTokenType[CSSSelectorTokenType["AnyTag"] = 3] = "AnyTag";
    /** `[...]` */
    CSSSelectorTokenType[CSSSelectorTokenType["Attribute"] = 4] = "Attribute";
    /** Like `&-sub`, must determine it by joining parent selector. */
    CSSSelectorTokenType[CSSSelectorTokenType["Nesting"] = 5] = "Nesting";
    // `+, >, ||, ~, |`
    CSSSelectorTokenType[CSSSelectorTokenType["Combinator"] = 6] = "Combinator";
    // `' '`
    CSSSelectorTokenType[CSSSelectorTokenType["Separator"] = 7] = "Separator";
    // `,`
    CSSSelectorTokenType[CSSSelectorTokenType["Comma"] = 8] = "Comma";
    // `:hover`
    CSSSelectorTokenType[CSSSelectorTokenType["Pseudo"] = 9] = "Pseudo";
    // `::before`
    CSSSelectorTokenType[CSSSelectorTokenType["PseudoElement"] = 10] = "PseudoElement";
    CSSSelectorTokenType[CSSSelectorTokenType["CommentText"] = 11] = "CommentText";
})(CSSSelectorTokenType || (exports.CSSSelectorTokenType = CSSSelectorTokenType = {}));
var ScanState;
(function (ScanState) {
    ScanState[ScanState["EOF"] = 0] = "EOF";
    ScanState[ScanState["AnyContent"] = 1] = "AnyContent";
    ScanState[ScanState["WithinTag"] = 2] = "WithinTag";
    ScanState[ScanState["WithinNesting"] = 3] = "WithinNesting";
    ScanState[ScanState["WithinClassName"] = 4] = "WithinClassName";
    ScanState[ScanState["WithinIdName"] = 5] = "WithinIdName";
    ScanState[ScanState["WithinAttribute"] = 6] = "WithinAttribute";
    ScanState[ScanState["WithinPseudo"] = 7] = "WithinPseudo";
    ScanState[ScanState["WithinPseudoElement"] = 8] = "WithinPseudoElement";
    ScanState[ScanState["WithinCSSComment"] = 9] = "WithinCSSComment";
    ScanState[ScanState["WithinSassLessComment"] = 10] = "WithinSassLessComment";
})(ScanState || (ScanState = {}));
/** Match selector name. */
const IsName = /[\w&-]/g;
/** Match not selector name. */
const IsNotName = /[^\w&-]/g;
function isName(char) {
    IsName.lastIndex = 0;
    return IsName.test(char);
}
/** For scanning css selector string. */
class CSSSelectorTokenScanner extends any_1.AnyTokenScanner {
    needToSeparate = false;
    /** `.a, .b` -> `[.a, .b]`. */
    parseToSeparatedTokens() {
        let tokens = this.parseToTokens();
        let groups = [];
        // Split by comma.
        for (let token of tokens) {
            if (token.type === CSSSelectorTokenType.Comma) {
                if (groups.length === 0 || groups[groups.length - 1].length > 0) {
                    groups.push([]);
                }
            }
            else {
                if (groups.length === 0) {
                    groups.push([]);
                }
                groups[groups.length - 1].push(token);
            }
        }
        return groups;
    }
    /**
     * Parse to CSS selector tokens.
     * This is rough tokens, more details wait to be determined.
     */
    *parseToTokens() {
        while (this.state !== ScanState.EOF) {
            if (this.state === ScanState.AnyContent) {
                if (!this.readUntil(/[\w&.#\[:+>|~,\/*]/g)) {
                    break;
                }
                let char = this.peekChar();
                // `|&`
                if (char === '&') {
                    yield* this.makeSeparatorToken();
                    this.state = ScanState.WithinNesting;
                }
                // `|a`
                else if (isName(char)) {
                    yield* this.makeSeparatorToken();
                    this.state = ScanState.WithinTag;
                }
                // `|.a`
                else if (char === '.') {
                    yield* this.makeSeparatorToken();
                    // Move to `.|`
                    this.offset += 1;
                    this.state = ScanState.WithinClassName;
                }
                // `|#a`
                else if (char === '#' && this.peekChar(1) !== '{') {
                    yield* this.makeSeparatorToken();
                    // Move to `#|`
                    this.offset += 1;
                    this.state = ScanState.WithinIdName;
                }
                // `|*`
                else if (char === '*') {
                    yield* this.makeSeparatorToken();
                    // Move to `*|`
                    this.offset += 1;
                    yield this.makeToken(CSSSelectorTokenType.AnyTag);
                    this.state = ScanState.AnyContent;
                }
                // `|[`
                else if (char === '[') {
                    yield* this.makeSeparatorToken();
                    this.state = ScanState.WithinAttribute;
                }
                // `|::a`
                else if (char === ':' && this.peekChar(1) === ':') {
                    yield* this.makeSeparatorToken();
                    // Move to `::|`
                    this.offset += 2;
                    this.state = ScanState.WithinPseudoElement;
                }
                // `|:a`
                else if (char === ':') {
                    yield* this.makeSeparatorToken();
                    // Move to `:|`
                    this.offset += 1;
                    this.state = ScanState.WithinPseudo;
                }
                // Cursor before `||`
                else if (char === '|' && this.peekChar(1) === '|') {
                    this.sync();
                    this.needToSeparate = false;
                    // Move to after `|`
                    this.offset += 2;
                    yield this.makeToken(CSSSelectorTokenType.Combinator);
                    this.state = ScanState.AnyContent;
                }
                // `|+`
                else if (char === '+' || char === '>' || char === '~' || char === '|') {
                    this.sync();
                    this.needToSeparate = false;
                    // Move to `+|`
                    this.offset += 1;
                    yield this.makeToken(CSSSelectorTokenType.Combinator);
                    this.state = ScanState.AnyContent;
                }
                // `|,`
                else if (char === ',') {
                    this.sync();
                    this.needToSeparate = false;
                    // Move to `+|`
                    this.offset += 1;
                    yield this.makeToken(CSSSelectorTokenType.Comma);
                    this.state = ScanState.AnyContent;
                }
                // `|/*`
                else if (char === '/' && this.peekChar(1) === '*') {
                    // Move to `/*|`
                    this.offset += 2;
                    this.sync();
                    this.state = ScanState.WithinCSSComment;
                }
                // `|//`
                else if (language_ids_1.LanguageIds.isScssLessSyntax(this.languageId) && char === '/' && this.peekChar(1) === '/') {
                    // Move to `/*|`
                    this.offset += 2;
                    this.sync();
                    this.state = ScanState.WithinSassLessComment;
                }
                else {
                    this.offset += 1;
                }
            }
            else if (this.state === ScanState.WithinTag) {
                // `abc|`
                this.readUntil(IsNotName);
                yield this.makeToken(CSSSelectorTokenType.Tag);
                this.state = ScanState.AnyContent;
                this.needToSeparate = true;
            }
            else if (this.state === ScanState.WithinNesting) {
                // `&abc|`
                this.readUntil(IsNotName);
                yield this.makeToken(CSSSelectorTokenType.Nesting);
                this.state = ScanState.AnyContent;
                this.needToSeparate = true;
            }
            else if (this.state === ScanState.WithinClassName) {
                // `.abc|`
                this.readUntil(IsNotName);
                yield this.makeToken(CSSSelectorTokenType.Class);
                this.state = ScanState.AnyContent;
                this.needToSeparate = true;
            }
            else if (this.state === ScanState.WithinIdName) {
                // `#abc|`
                this.readUntil(IsNotName);
                yield this.makeToken(CSSSelectorTokenType.Id);
                this.state = ScanState.AnyContent;
                this.needToSeparate = true;
            }
            else if (this.state === ScanState.WithinAttribute) {
                // `[attr]|`
                if (!this.readBracketed()) {
                    break;
                }
                yield this.makeToken(CSSSelectorTokenType.Attribute);
                this.state = ScanState.AnyContent;
                this.needToSeparate = true;
            }
            else if (this.state === ScanState.WithinPseudo) {
                // `:hover|`
                this.readUntil(IsNotName);
                // `:has(...)|`
                if (this.peekChar() === '(') {
                    if (!this.readBracketed()) {
                        break;
                    }
                }
                yield this.makeToken(CSSSelectorTokenType.Pseudo);
                this.state = ScanState.AnyContent;
                this.needToSeparate = true;
            }
            else if (this.state === ScanState.WithinPseudoElement) {
                // `::before|`
                this.readUntil(IsNotName);
                // `::highlight(...)|`
                if (this.peekChar() === '(') {
                    if (!this.readBracketed()) {
                        break;
                    }
                }
                yield this.makeToken(CSSSelectorTokenType.PseudoElement);
                this.state = ScanState.AnyContent;
                this.needToSeparate = true;
            }
            else if (this.state === ScanState.WithinCSSComment) {
                // `|*/`
                if (!this.readUntil(/\*\//g)) {
                    break;
                }
                yield this.makeToken(CSSSelectorTokenType.CommentText);
                // Move to `*/|`
                this.offset += 2;
                this.sync();
                this.state = ScanState.AnyContent;
            }
            else if (this.state === ScanState.WithinSassLessComment) {
                // `|//`
                if (!this.readUntil(/\/\//g)) {
                    break;
                }
                yield this.makeToken(CSSSelectorTokenType.CommentText);
                // Move to `//|`
                this.offset += 2;
                this.sync();
                this.state = ScanState.AnyContent;
            }
        }
    }
    *makeSeparatorToken() {
        if (this.needToSeparate && this.offset > this.start) {
            yield this.makeToken(CSSSelectorTokenType.Separator);
            this.needToSeparate = false;
        }
        else {
            this.sync();
        }
    }
}
exports.CSSSelectorTokenScanner = CSSSelectorTokenScanner;
//# sourceMappingURL=css-selector.js.map