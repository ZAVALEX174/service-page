"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSTokenScanner = exports.CSSTokenType = void 0;
const any_1 = require("./any");
/** CSS token type. */
var CSSTokenType;
(function (CSSTokenType) {
    /**
     * When first time doing scanning,
     * can't determine whether a token is selector or property.
     * Note it includes whitespaces at head and tail.
     */
    CSSTokenType[CSSTokenType["NotDetermined"] = 0] = "NotDetermined";
    CSSTokenType[CSSTokenType["ClosureStart"] = 1] = "ClosureStart";
    CSSTokenType[CSSTokenType["ClosureEnd"] = 2] = "ClosureEnd";
    CSSTokenType[CSSTokenType["SemiColon"] = 3] = "SemiColon";
    CSSTokenType[CSSTokenType["CommentText"] = 4] = "CommentText";
    CSSTokenType[CSSTokenType["SassInterpolation"] = 5] = "SassInterpolation";
})(CSSTokenType || (exports.CSSTokenType = CSSTokenType = {}));
var ScanState;
(function (ScanState) {
    ScanState[ScanState["EOF"] = 0] = "EOF";
    ScanState[ScanState["AnyContent"] = 1] = "AnyContent";
    ScanState[ScanState["WithinSassInterpolation"] = 2] = "WithinSassInterpolation";
    ScanState[ScanState["WithinCSSComment"] = 3] = "WithinCSSComment";
    ScanState[ScanState["WithinScssLessComment"] = 4] = "WithinScssLessComment";
})(ScanState || (ScanState = {}));
/** For CSS Like languages. */
class CSSTokenScanner extends any_1.AnyTokenScanner {
    /**
     * Parse css string to tokens.
     * This is rough tokens, more details wait to be determined.
     */
    *parseToTokens() {
        while (this.state !== ScanState.EOF) {
            if (this.state === ScanState.AnyContent) {
                if (!this.readUntil(/[\/#{};"']/g)) {
                    break;
                }
                // `|#{`
                else if (this.languageId !== 'css' && this.peekChars(0, 2) === '#{') {
                    yield* this.makeNotDeterminedToken();
                    // Move to `#{|`
                    this.offset += 2;
                    this.sync();
                    this.state = ScanState.WithinSassInterpolation;
                }
                // `|{`
                else if (this.peekChar() === '{') {
                    yield* this.makeNotDeterminedToken();
                    // Move to `{|`
                    this.offset += 1;
                    yield this.makeToken(CSSTokenType.ClosureStart);
                    this.state = ScanState.AnyContent;
                }
                // `|}`
                else if (this.peekChar() === '}') {
                    yield* this.makeNotDeterminedToken();
                    // Move to `}|`
                    this.offset += 1;
                    yield this.makeToken(CSSTokenType.ClosureEnd);
                    this.state = ScanState.AnyContent;
                }
                // `|;`
                else if (this.peekChar() === ';') {
                    yield* this.makeNotDeterminedToken();
                    // Move to `;|`
                    this.offset += 1;
                    yield this.makeToken(CSSTokenType.SemiColon);
                    this.state = ScanState.AnyContent;
                }
                // |' or |", eat string but not change state.
                else if (this.peekChar() === '"' || this.peekChar() === '\'') {
                    this.readString();
                }
                // `|/*`
                else if (this.peekChars(0, 2) === '/*') {
                    yield* this.makeNotDeterminedToken();
                    // Move to `/*|`
                    this.offset += 2;
                    this.sync();
                    this.state = ScanState.WithinCSSComment;
                }
                // `|//`
                else if (this.languageId !== 'css' && this.peekChars(0, 2) === '//') {
                    yield* this.makeNotDeterminedToken();
                    // Move to `//|`
                    this.offset += 2;
                    this.sync();
                    this.state = ScanState.WithinScssLessComment;
                }
                else {
                    this.offset += 1;
                }
            }
            else if (this.state === ScanState.WithinSassInterpolation) {
                // `|}`
                if (!this.readUntil(/[}]/g)) {
                    break;
                }
                yield this.makeToken(CSSTokenType.SassInterpolation);
                // Move to `}|`
                this.offset += 1;
                this.sync();
                this.state = ScanState.AnyContent;
            }
            else if (this.state === ScanState.WithinCSSComment) {
                // `|*/`
                if (!this.readUntil(/\*\//g)) {
                    break;
                }
                yield this.makeToken(CSSTokenType.CommentText);
                // Move to `*/|`
                this.offset += 2;
                this.sync();
                this.state = ScanState.AnyContent;
            }
            else if (this.state === ScanState.WithinScssLessComment) {
                // `|\n`
                if (!this.readLine()) {
                    break;
                }
                yield this.makeToken(CSSTokenType.CommentText);
                // Move to `\n|`
                this.offset += 1;
                // Move to `\r\n|`
                if (this.peekChar() === '\r' || this.peekChar() === '\n') {
                    this.offset += 1;
                }
                this.sync();
                this.state = ScanState.AnyContent;
            }
        }
        yield* this.makeNotDeterminedToken();
    }
    *makeNotDeterminedToken() {
        if (this.start < this.offset && /\S/.test(this.peekText())) {
            yield this.makeToken(CSSTokenType.NotDetermined);
        }
        else {
            this.sync();
        }
    }
}
exports.CSSTokenScanner = CSSTokenScanner;
//# sourceMappingURL=css.js.map