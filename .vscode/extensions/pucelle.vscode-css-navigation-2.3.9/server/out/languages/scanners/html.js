"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhiteListHTMLTokenScanner = exports.HTMLTokenScanner = exports.HTMLTokenType = void 0;
const language_ids_1 = require("../language-ids");
const any_1 = require("./any");
/** HTML token type. */
var HTMLTokenType;
(function (HTMLTokenType) {
    /** <!DOCTYPE>. */
    HTMLTokenType[HTMLTokenType["Doctype"] = 0] = "Doctype";
    /** Start tag name exclude `<`. */
    HTMLTokenType[HTMLTokenType["StartTagName"] = 1] = "StartTagName";
    /** End tag name exclude `</` and `>`. */
    HTMLTokenType[HTMLTokenType["EndTagName"] = 2] = "EndTagName";
    /** `<... >`, not include tag end of close tag. */
    HTMLTokenType[HTMLTokenType["TagEnd"] = 3] = "TagEnd";
    /** `<... />`. */
    HTMLTokenType[HTMLTokenType["SelfCloseTagEnd"] = 4] = "SelfCloseTagEnd";
    /** Attribute name part. */
    HTMLTokenType[HTMLTokenType["AttributeName"] = 5] = "AttributeName";
    /** Include quotes. */
    HTMLTokenType[HTMLTokenType["AttributeValue"] = 6] = "AttributeValue";
    /** Original text, not been trimmed. */
    HTMLTokenType[HTMLTokenType["Text"] = 7] = "Text";
    /** Exclude `<!--` and `-->`. */
    HTMLTokenType[HTMLTokenType["CommentText"] = 8] = "CommentText";
})(HTMLTokenType || (exports.HTMLTokenType = HTMLTokenType = {}));
var ScanState;
(function (ScanState) {
    ScanState[ScanState["EOF"] = 0] = "EOF";
    ScanState[ScanState["AnyContent"] = 1] = "AnyContent";
    ScanState[ScanState["WithinStartTag"] = 2] = "WithinStartTag";
    ScanState[ScanState["AfterStartTag"] = 3] = "AfterStartTag";
    ScanState[ScanState["WithinEndTag"] = 4] = "WithinEndTag";
    ScanState[ScanState["WithinAttributeName"] = 5] = "WithinAttributeName";
    ScanState[ScanState["AfterAttributeName"] = 6] = "AfterAttributeName";
    ScanState[ScanState["AfterAttributeEqual"] = 7] = "AfterAttributeEqual";
    ScanState[ScanState["WithinAttributeValue"] = 8] = "WithinAttributeValue";
    ScanState[ScanState["WithinComment"] = 9] = "WithinComment";
    ScanState[ScanState["WithinDoctype"] = 10] = "WithinDoctype";
})(ScanState || (ScanState = {}));
/** Match tag name, Add `$` to match template interpolation. */
const IsTagName = /[\w:-]/g;
/** Match not tag name. */
const IsNotTagName = /[^\w:-]/g;
/** Match attribute name. */
const IsAttrName = /[\w@:.?$-]/g;
/** Match not attribute name. */
const IsNotAttrName = /[^\w@:.?$-]/g;
function isTagName(char) {
    IsTagName.lastIndex = 0;
    return IsTagName.test(char);
}
function isAttrName(char) {
    IsAttrName.lastIndex = 0;
    return IsAttrName.test(char);
}
class HTMLTokenScanner extends any_1.AnyTokenScanner {
    endTagNameMustMatch = null;
    /** Parse html string to tokens. */
    *parseToTokens() {
        while (this.state !== ScanState.EOF) {
            if (this.state === ScanState.AnyContent) {
                yield* this.onAnyContent();
            }
            else if (this.state === ScanState.WithinComment) {
                yield* this.onWithinComment();
            }
            else if (this.state === ScanState.WithinDoctype) {
                yield* this.onWithinDoctype();
            }
            else if (this.state === ScanState.WithinStartTag) {
                yield* this.onWithinStartTag();
            }
            else if (this.state === ScanState.WithinEndTag) {
                yield* this.onWithinEndTag();
            }
            else if (this.state === ScanState.AfterStartTag) {
                yield* this.onAfterStartTag();
            }
            else if (this.state === ScanState.WithinAttributeName) {
                yield* this.onWithinAttributeName();
            }
            else if (this.state === ScanState.AfterAttributeName) {
                this.onAfterAttributeName();
            }
            else if (this.state === ScanState.WithinAttributeValue) {
                yield* this.onWithinAttributeValue();
            }
        }
        yield* this.makeTextToken();
    }
    *onAnyContent() {
        // `|<`
        if (!this.readUntil(/</g)) {
            return;
        }
        // `|<!--`
        if (this.peekChars(1, 3) === '!--') {
            yield* this.makeTextToken();
            // Move to `<--|`
            this.offset += 3;
            this.sync();
            this.state = ScanState.WithinComment;
        }
        // |<!
        else if (this.peekChar(1) === '!') {
            yield* this.makeTextToken();
            // Move to `<!|`
            this.offset += 2;
            this.sync();
            this.state = ScanState.WithinDoctype;
        }
        // `|</`
        else if (this.peekChar(1) === '/') {
            yield* this.makeTextToken();
            // Move to `</|`
            this.offset += 2;
            this.sync();
            this.state = ScanState.WithinEndTag;
        }
        // `|<a`
        else if (isTagName(this.peekChar(1))) {
            yield* this.makeTextToken();
            // Move to `<|a`
            this.offset += 1;
            this.sync();
            this.state = ScanState.WithinStartTag;
        }
        else {
            this.offset += 1;
        }
    }
    *onWithinComment() {
        // `-->|`
        if (!this.readUntil(/-->/g)) {
            return;
        }
        yield this.makeToken(HTMLTokenType.CommentText);
        // Move to `-->|`
        this.offset += 3;
        this.sync();
        this.state = ScanState.AnyContent;
    }
    *onWithinDoctype() {
        // `|>`
        if (!this.readUntil(/>/g)) {
            return;
        }
        yield this.makeToken(HTMLTokenType.Doctype);
        // Move to `>|`
        this.offset += 1;
        this.sync();
        this.state = ScanState.AnyContent;
    }
    *onWithinStartTag() {
        // `<abc|`
        if (!this.readUntil(IsNotTagName)) {
            return;
        }
        let tagName = this.peekText();
        let lowerTagName = tagName.toLowerCase();
        yield this.makeToken(HTMLTokenType.StartTagName);
        if (lowerTagName === 'script' || lowerTagName === 'style') {
            this.endTagNameMustMatch = lowerTagName;
        }
        this.state = ScanState.AfterStartTag;
    }
    *onWithinEndTag() {
        // `</abc|>` or `</|>`
        if (!this.readUntil(IsNotTagName)) {
            return;
        }
        let tagName = this.peekText();
        let lowerTagName = tagName.toLowerCase();
        // Must end when `</style>` or `</script>`
        if (this.endTagNameMustMatch && lowerTagName !== this.endTagNameMustMatch) {
            this.state = ScanState.AnyContent;
        }
        else {
            this.endTagNameMustMatch = null;
            // This token may be empty.
            yield this.makeToken(HTMLTokenType.EndTagName);
            // `</abc>|`, skip `>`
            if (!this.readOut(/>/g)) {
                return;
            }
            this.sync();
            this.state = ScanState.AnyContent;
        }
    }
    *onAfterStartTag() {
        // Skip whitespaces.
        this.readWhiteSpaces();
        let char = this.peekChar();
        if (char === '>') {
            // Move to `>|`
            this.offset += 1;
            this.sync();
            // `/>|`
            if (this.peekChar(-2) === '/') {
                yield this.makeToken(HTMLTokenType.SelfCloseTagEnd);
            }
            // `>|`
            else {
                yield this.makeToken(HTMLTokenType.TagEnd);
            }
            this.state = ScanState.AnyContent;
        }
        // `|name`
        else if (isAttrName(char)) {
            this.sync();
            this.state = ScanState.WithinAttributeName;
        }
        else {
            this.offset += 1;
        }
    }
    *onWithinAttributeName() {
        // `name|`
        this.readUntil(IsNotAttrName);
        yield this.makeToken(HTMLTokenType.AttributeName);
        this.state = ScanState.AfterAttributeName;
    }
    onAfterAttributeName() {
        // Skip white spaces.
        if (!this.readWhiteSpaces()) {
            return;
        }
        this.sync();
        // `name|=`
        if (this.peekChar() === '=') {
            // Skip `=`.
            this.offset += 1;
            // Skip white spaces.
            this.readWhiteSpaces();
            this.sync();
            this.state = ScanState.WithinAttributeValue;
        }
        // `name |?`
        else {
            this.state = ScanState.AfterStartTag;
            this.sync();
        }
    }
    *onWithinAttributeValue() {
        let char = this.peekChar();
        // `=|"..."`
        if (char === '"' || char === '\'') {
            // "..."|
            this.readString();
            yield this.makeToken(HTMLTokenType.AttributeValue);
            this.state = ScanState.AfterStartTag;
        }
        else {
            // `name=value`
            // `name=${{a: b}}`
            // `name={[a, b]}`
            this.readExpressionLikeAttrValue();
            yield this.makeToken(HTMLTokenType.AttributeValue);
            this.state = ScanState.AfterStartTag;
        }
    }
    *makeTextToken() {
        if (this.start < this.offset) {
            yield this.makeToken(HTMLTokenType.Text);
        }
        else {
            this.sync();
        }
    }
    /**
     * Try read an expression as attribute value,
     * brackets or quotes must appear in pairs.
     */
    readExpressionLikeAttrValue() {
        let stack = [];
        let expect = null;
        let re = /[()\[\]{}"'`\/\s>]/g;
        while (this.state !== ScanState.EOF) {
            if (!this.readUntil(re)) {
                return;
            }
            let char = this.peekChar();
            // Only difference with `readBracketed`.
            if (!expect && /[\s>]/.test(char)) {
                break;
            }
            // `|"..."`
            else if (char === '"' || char === '\'') {
                this.readString();
                continue;
            }
            // '|`...`'
            else if (char === '`' && language_ids_1.LanguageIds.isScriptSyntax(this.languageId)) {
                this.readTemplateLiteral();
                continue;
            }
            // `|/*`
            else if (char === '/' && this.peekChar(1) === '*') {
                // Move cursor to `/*|`.
                this.offset += 2;
                this.readOut(/\*\//g);
                continue;
            }
            // `|//`
            else if (char === '/' && this.peekChar(1) === '/') {
                // Move cursor to `//|`.
                this.offset += 2;
                this.readLineAndEnd();
                continue;
            }
            // Eat the char.
            this.offset += 1;
            if (char === expect) {
                if (stack.length > 0) {
                    expect = stack.pop();
                }
                else {
                    expect = null;
                }
            }
            else if (char === '[' || char === '(' || char === '{') {
                if (expect) {
                    stack.push(expect);
                }
                expect = any_1.BRACKETS_MAP[char];
            }
        }
        return this.state !== ScanState.EOF;
    }
}
exports.HTMLTokenScanner = HTMLTokenScanner;
/** For parsing react elements. */
class WhiteListHTMLTokenScanner extends HTMLTokenScanner {
    whiteList;
    constructor(string, scannerStart = 0, languageId, whiteList) {
        super(string, scannerStart, languageId);
        this.whiteList = whiteList;
    }
    *onWithinStartTag() {
        // `<abc|`
        if (!this.readUntil(IsNotTagName)) {
            return;
        }
        let tagName = this.peekText();
        // If not in white list.
        if (!this.whiteList.has(tagName)) {
            this.state = ScanState.AnyContent;
            return;
        }
        yield this.makeToken(HTMLTokenType.StartTagName);
        if (tagName === 'style') {
            this.endTagNameMustMatch = tagName;
        }
        this.state = ScanState.AfterStartTag;
    }
    *onWithinEndTag() {
        // `</abc|>` or `</|>`
        if (!this.readUntil(IsNotTagName)) {
            return;
        }
        let tagName = this.peekText();
        if (!this.whiteList.has(tagName)) {
            this.state = ScanState.AnyContent;
            return;
        }
        // Must end when `</style>` or `</script>`
        if (this.endTagNameMustMatch && tagName !== this.endTagNameMustMatch) {
            this.state = ScanState.AnyContent;
            return;
        }
        this.endTagNameMustMatch = null;
        // This token may be empty.
        yield this.makeToken(HTMLTokenType.EndTagName);
        // `</abc>|`, skip `>`
        if (!this.readOut(/>/g)) {
            return;
        }
        this.sync();
        this.state = ScanState.AnyContent;
    }
}
exports.WhiteListHTMLTokenScanner = WhiteListHTMLTokenScanner;
//# sourceMappingURL=html.js.map