"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SassIndentedTokenScanner = exports.ScanState = void 0;
const any_1 = require("./any");
const css_1 = require("./css");
var ScanState;
(function (ScanState) {
    ScanState[ScanState["EOF"] = 0] = "EOF";
    ScanState[ScanState["AnyContent"] = 1] = "AnyContent";
    ScanState[ScanState["WithinSassInterpolation"] = 2] = "WithinSassInterpolation";
    ScanState[ScanState["WithinCSSComment"] = 3] = "WithinCSSComment";
    ScanState[ScanState["WithinScssLessComment"] = 4] = "WithinScssLessComment";
    ScanState[ScanState["LineWrap"] = 5] = "LineWrap";
})(ScanState || (exports.ScanState = ScanState = {}));
/** For Sass indented language. */
class SassIndentedTokenScanner extends any_1.AnyTokenScanner {
    /**
     * Parse html string to tokens.
     * This is rough tokens, more details wait to be determined.
     */
    *parseToTokens(start = 0) {
        this.start = this.offset = start;
        let indentCountStack = [];
        let currentIndentCount = 0;
        while (this.state !== ScanState.EOF) {
            if (this.state === ScanState.AnyContent) {
                this.readUntil(/[\/#"'\r\n]/g);
                if (this.isEnded()) {
                    break;
                }
                // `|/*`
                else if (this.peekChars(0, 2) === '/*') {
                    yield* this.endNotDetermined();
                    // Move to `/*|`
                    this.offset += 2;
                    this.sync();
                    this.state = ScanState.WithinCSSComment;
                }
                // `|//`
                else if (this.peekChars(0, 2) === '//') {
                    yield* this.endNotDetermined();
                    // Move to `//|`
                    this.offset += 2;
                    this.sync();
                    this.state = ScanState.WithinScssLessComment;
                }
                // `|#{`
                else if (this.peekChars(0, 2) === '#{') {
                    yield* this.endNotDetermined();
                    // Move to `#{|`
                    this.offset += 2;
                    this.sync();
                    this.state = ScanState.WithinSassInterpolation;
                }
                // `|\n`
                else if (this.peekChar() === '\r' || this.peekChar() === '\n') {
                    yield* this.endNotDetermined();
                    // Move to `\n|`
                    this.offset += 1;
                    // Move to `\r\n|`
                    if (this.peekChar() === '\r' || this.peekChar() === '\n') {
                        this.offset += 1;
                    }
                    this.sync();
                    this.state = ScanState.LineWrap;
                }
                // |' or |", eat string but not change state.
                else if (this.peekChar() === '"' || this.peekChar() === '\'') {
                    this.readString();
                }
                else {
                    this.offset += 1;
                }
            }
            else if (this.state === ScanState.WithinSassInterpolation) {
                // `|}`
                this.readUntil(/[}]/g);
                if (this.isEnded()) {
                    break;
                }
                yield this.makeToken(css_1.CSSTokenType.SassInterpolation);
                // Move to `}|`
                this.offset += 1;
                this.sync();
                this.state = ScanState.AnyContent;
            }
            else if (this.state === ScanState.LineWrap) {
                // `\t|`
                this.readUntil(/[^\t ]/g);
                if (this.isEnded()) {
                    break;
                }
                let indentText = this.peekText();
                let indentCount = this.checkIndentCount(indentText);
                this.sync();
                // |.class1
                //     color: red
                if (indentCount > currentIndentCount) {
                    yield this.makeToken(css_1.CSSTokenType.ClosureStart);
                    indentCountStack.push(currentIndentCount);
                    currentIndentCount = indentCount;
                }
                //     color: red
                // |.class1
                else if (indentCount < currentIndentCount) {
                    while (indentCountStack.length > 0 && indentCountStack[indentCountStack.length - 1] >= indentCount) {
                        indentCountStack.pop();
                        yield this.makeToken(css_1.CSSTokenType.ClosureEnd);
                    }
                    currentIndentCount = indentCount;
                }
                // color: red
                // font: Arial
                else {
                    yield this.makeToken(css_1.CSSTokenType.SemiColon);
                }
                yield this.makeToken(css_1.CSSTokenType.SassInterpolation);
                // Move to `}|`
                this.offset += 1;
                this.sync();
                this.state = ScanState.AnyContent;
            }
            else if (this.state === ScanState.WithinCSSComment) {
                // `*/|`
                this.readUntil(/\*\//);
                if (this.isEnded()) {
                    break;
                }
                yield this.makeToken(css_1.CSSTokenType.CommentText);
                // Move to `*/|`
                this.offset += 1;
                this.sync();
                this.state = ScanState.AnyContent;
            }
            else if (this.state === ScanState.WithinScssLessComment) {
                // `|\n`
                this.readLine();
                if (this.isEnded()) {
                    break;
                }
                yield this.makeToken(css_1.CSSTokenType.CommentText);
                // Move to `\n|`
                this.offset += 1;
                this.sync();
                this.state = ScanState.AnyContent;
            }
        }
        while (indentCountStack.length > 0) {
            indentCountStack.pop();
            yield this.makeToken(css_1.CSSTokenType.ClosureEnd);
        }
    }
    checkIndentCount(text) {
        let re = /\t|  /g;
        let count = 0;
        while (re.exec(text)) {
            count++;
        }
        return count;
    }
    *endNotDetermined() {
        if (this.start < this.offset && /\S/.test(this.peekText())) {
            yield this.makeToken(css_1.CSSTokenType.NotDetermined);
        }
    }
}
exports.SassIndentedTokenScanner = SassIndentedTokenScanner;
//# sourceMappingURL=css-sass-indented.js.map