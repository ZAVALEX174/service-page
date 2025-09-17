"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLTokenTree = void 0;
const html_1 = require("../scanners/html");
const parts_1 = require("../parts");
const utils_1 = require("./utils");
const picker_1 = require("./picker");
const css_tree_1 = require("./css-tree");
const html_node_1 = require("./html-node");
const js_tree_1 = require("./js-tree");
/**
 * Tags that self closing.
 * Reference from https://developer.mozilla.org/en-US/docs/Glossary/Void_element
 */
const SelfClosingTags = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
];
class HTMLTokenTree extends html_node_1.HTMLTokenNode {
    /** Make a HTML token tree by string. */
    static fromString(string, scannerStart = 0, languageId = 'html') {
        let tokens = new html_1.HTMLTokenScanner(string, scannerStart, languageId).parseToTokens();
        return HTMLTokenTree.fromTokens(tokens, languageId);
    }
    /** Make a token tree by tokens. */
    static fromTokens(tokens, languageId = 'html') {
        let tree = new HTMLTokenTree(languageId);
        let current = tree;
        let currentAttr = null;
        for (let token of tokens) {
            if (token.type === html_1.HTMLTokenType.StartTagName) {
                let tagNode = new html_node_1.HTMLTokenNode(token, current);
                current.children.push(tagNode);
                current = tagNode;
            }
            else if (token.type === html_1.HTMLTokenType.EndTagName) {
                do {
                    // </name>
                    if (current.token.text === token.text) {
                        current = current.parent ?? tree;
                        break;
                    }
                    // </>
                    if (token.text === '') {
                        current = current.parent ?? tree;
                        break;
                    }
                    current = current.parent ?? tree;
                } while (current !== tree);
            }
            else if (token.type === html_1.HTMLTokenType.TagEnd) {
                if (current && current.token.type === html_1.HTMLTokenType.StartTagName
                    && SelfClosingTags.includes(current.token.text)) {
                    current = current.parent ?? tree;
                }
            }
            else if (token.type === html_1.HTMLTokenType.SelfCloseTagEnd) {
                if (current && current.token.type === html_1.HTMLTokenType.StartTagName) {
                    current = current.parent ?? tree;
                }
            }
            else if (token.type === html_1.HTMLTokenType.AttributeName) {
                if (current && current.token.type === html_1.HTMLTokenType.StartTagName) {
                    currentAttr = { name: token, value: null };
                    current.attrs.push(currentAttr);
                }
            }
            else if (token.type === html_1.HTMLTokenType.AttributeValue) {
                if (currentAttr) {
                    currentAttr.value = token;
                }
            }
            else if (token.type === html_1.HTMLTokenType.Text) {
                let textNode = new html_node_1.HTMLTokenNode(token, current);
                current.children.push(textNode);
            }
            else if (token.type === html_1.HTMLTokenType.CommentText) {
                let commentNode = new html_node_1.HTMLTokenNode(token, current);
                current.children.push(commentNode);
            }
        }
        return tree;
    }
    languageId;
    constructor(languageId) {
        super({
            type: html_1.HTMLTokenType.StartTagName,
            text: 'root',
            start: -1,
            end: -1,
        }, null);
        this.languageId = languageId;
    }
    isScriptSyntax() {
        return this.languageId !== 'html';
    }
    *walkParts() {
        for (let node of this.walk()) {
            yield* this.parseNodeParts(node);
        }
    }
    /** Parse node and attributes. */
    *parseNodeParts(node) {
        if (node.token.type === html_1.HTMLTokenType.StartTagName) {
            yield new parts_1.Part(parts_1.PartType.Tag, node.token.text, node.token.start, node.tagLikeEnd);
            // Parse attributes and sort them.
            yield* this.sortParts(this.parseAttrParts(node));
            if (node.tagName === 'script') {
                yield* this.parseScriptPart(node);
            }
            else if (node.tagName === 'style') {
                yield* this.parseStylePart(node);
            }
        }
    }
    /** Parse attributes for parts. */
    *parseAttrParts(node) {
        for (let attr of node.attrs) {
            yield* this.parseAttrPart(attr.name, attr.value);
        }
        yield* this.parseImportPart(node);
    }
    /** For attribute part. */
    *parseAttrPart(attrName, attrValue) {
        let name = attrName.text;
        if (name === 'id') {
            if (attrValue) {
                yield new parts_1.Part(parts_1.PartType.Id, attrValue.text, attrValue.start).removeQuotes();
            }
        }
        else if (name === 'style') {
            if (attrValue) {
                yield* this.parseStylePropertyParts(attrValue.text, attrValue.start);
            }
        }
        // For `Lupos.js`, complete `:class.|name|` with class names.
        else if (this.isScriptSyntax() && name.startsWith(':class.')) {
            yield new parts_1.Part(parts_1.PartType.Class, attrName.text.slice(7), attrName.start + 7);
        }
        // For `Lupos.js`, complete `:style.-` with CSS Variables.
        else if (this.isScriptSyntax() && name.startsWith(':style.-')) {
            yield new parts_1.Part(parts_1.PartType.CSSVariableAssignment, attrName.text.slice(7), attrName.start + 7);
        }
        // For normal class attribute, or for `JSX`, `Lupos.js`, `Vue.js`
        else if (name === 'class' || name === 'className' || name === ':class') {
            if (attrValue) {
                let value = attrValue.text;
                // Probably expression.
                if (this.isScriptSyntax() && (0, utils_1.mayBeExpression)(value)) {
                    for (let word of picker_1.Picker.pickWordsFromExpression(value)) {
                        yield new parts_1.Part(parts_1.PartType.Class, word.text, attrValue.start + word.start);
                    }
                    yield* this.parseReactModulePart(attrValue);
                }
                else {
                    for (let word of picker_1.Picker.pickWords(value)) {
                        yield new parts_1.Part(parts_1.PartType.Class, word.text, attrValue.start + word.start);
                    }
                }
                // Also provide completions for `class="|"`, or `class="abc |"`, or `class="abc | def"`.
                for (let word of picker_1.Picker.pickPotentialEmptyWords(value)) {
                    yield new parts_1.Part(parts_1.PartType.ClassPotential, word.text, attrValue.start + word.start);
                }
            }
        }
        // https://github.com/gajus/babel-plugin-react-css-modules and issue #60.
        // import 'xx.css'
        // `styleName="class-name"`
        else if (this.isScriptSyntax() && name === 'styleName') {
            if (attrValue) {
                yield new parts_1.Part(parts_1.PartType.ReactDefaultImportedCSSModuleClass, attrValue.text, attrValue.start).removeQuotes();
            }
        }
    }
    /** For import path, only for CSS imports. */
    *parseImportPart(node) {
        if (node.tagName === 'link') {
            if (node.getAttributeValue('rel') === 'stylesheet') {
                let href = node.getAttribute('href');
                if (href) {
                    yield new parts_1.Part(parts_1.PartType.CSSImportPath, href.text, href.start).removeQuotes();
                }
            }
        }
        // Vue.js only.
        else if (node.tagName === 'style') {
            let src = node.getAttribute('src');
            if (src) {
                yield new parts_1.Part(parts_1.PartType.CSSImportPath, src.text, src.start).removeQuotes();
            }
        }
    }
    /** For react css module. */
    *parseReactModulePart(attrValue) {
        let start = attrValue.start;
        // `class={style.className}`.
        // `class={style['class-name']}`.
        let match = picker_1.Picker.locateMatchGroups(attrValue.text, /^\s*\{\s*(?<moduleName>\w+)(?:\.(?<propertyName1>\w+)|\[\s*['"`](?<propertyName2>\w+)['"`]\s*\])\s*\}\s*$/);
        if (match) {
            yield new parts_1.Part(parts_1.PartType.ReactImportedCSSModuleName, match.moduleName.text, match.moduleName.start + start);
            let propertyName = match.propertyName1 ?? match.propertyName2;
            yield new parts_1.Part(parts_1.PartType.ReactImportedCSSModuleProperty, propertyName.text, propertyName.start + start);
        }
    }
    /** Parse script tag for parts. */
    *parseScriptPart(node) {
        let textNode = node.firstTextNode;
        // Not process embedded js within embedded html.
        if (textNode && textNode.token.text && this.languageId === 'html') {
            let jsTree = js_tree_1.JSTokenTree.fromString(textNode.token.text, textNode.token.start, 'js');
            yield* jsTree.walkParts();
        }
    }
    /** Parse style tag for parts. */
    *parseStylePart(node) {
        let textNode = node.firstTextNode;
        if (textNode) {
            let languageId = node.getAttributeValue('lang') ?? 'css';
            yield* this.parseStyleTextParts(textNode.token.text, textNode.token.start, languageId);
        }
    }
    /** Parse style content for parts. */
    *parseStyleTextParts(text, start, languageId) {
        let cssTree = css_tree_1.CSSTokenTree.fromString(text, start, languageId);
        yield* cssTree.walkParts();
    }
    /** Parse style property content for parts. */
    *parseStylePropertyParts(text, start) {
        let matches = picker_1.Picker.locateAllMatches(text, /([\w-]+)\s*:\s*(.+?)\s*(?:[;'"]|$)/g);
        for (let match of matches) {
            let name = match[1];
            let value = match[2];
            yield* css_tree_1.CSSTokenTree.parsePropertyNamePart(name.text, name.start + start, undefined, value.text);
            yield* css_tree_1.CSSTokenTree.parsePropertyValuePart(value.text, value.start + start);
        }
    }
}
exports.HTMLTokenTree = HTMLTokenTree;
//# sourceMappingURL=html-tree.js.map