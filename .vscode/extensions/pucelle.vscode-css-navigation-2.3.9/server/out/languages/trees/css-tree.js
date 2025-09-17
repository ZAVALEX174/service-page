"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSTokenTree = void 0;
const scanners_1 = require("../scanners");
const css_node_1 = require("./css-node");
const parts_1 = require("../parts");
const parts_2 = require("../parts");
const picker_1 = require("./picker");
const utils_1 = require("./utils");
const utils_2 = require("../../utils");
class CSSTokenTree extends css_node_1.CSSTokenNode {
    /** Make a CSS token tree by string. */
    static fromString(string, scannerStart, languageId) {
        let tokens;
        if (languageId === 'sass') {
            tokens = new scanners_1.SassIndentedTokenScanner(string, scannerStart, languageId).parseToTokens();
        }
        else {
            tokens = new scanners_1.CSSTokenScanner(string, scannerStart, languageId).parseToTokens();
        }
        return CSSTokenTree.fromTokens(tokens, string, languageId);
    }
    /** Make a CSS token tree by tokens. */
    static fromTokens(tokens, string, languageId) {
        let tree = new CSSTokenTree(string, languageId);
        let current = tree;
        let latestComment = null;
        let notDetermined = [];
        function parseNotDetermined(mayBeSelector) {
            let joint = (0, utils_1.joinTokens)(notDetermined, string);
            if (isCommandToken(joint)) {
                current.children.push(new css_node_1.CSSTokenNode(css_node_1.CSSTokenNodeType.Command, joint, current));
            }
            // Especially when inputting like `a{b|}`.
            else if (mayBeSelector && !joint.text.includes(':')) {
                current.children.push(new css_node_1.CSSTokenNode(css_node_1.CSSTokenNodeType.Selector, joint, current));
            }
            // Otherwise parse as property.
            else {
                let o = splitPropertyTokens(joint);
                if (o) {
                    let [nameToken, valueToken] = o;
                    let nameNode = new css_node_1.CSSTokenNode(css_node_1.CSSTokenNodeType.PropertyName, nameToken, current, latestComment);
                    let valueNode = new css_node_1.CSSTokenNode(css_node_1.CSSTokenNodeType.PropertyValue, valueToken, current);
                    nameNode.defEnd = valueToken.end;
                    current.children.push(nameNode, valueNode);
                }
            }
            notDetermined = [];
            latestComment = null;
        }
        for (let token of tokens) {
            if (token.type === scanners_1.CSSTokenType.NotDetermined) {
                notDetermined.push(token);
            }
            else if (token.type === scanners_1.CSSTokenType.SassInterpolation) {
                notDetermined.push(token);
            }
            else if (token.type === scanners_1.CSSTokenType.SemiColon) {
                if (notDetermined.length > 0) {
                    parseNotDetermined(false);
                }
            }
            else if (token.type === scanners_1.CSSTokenType.ClosureStart) {
                if (notDetermined.length > 0) {
                    let joint = (0, utils_1.joinTokens)(notDetermined, string);
                    let type = getSelectorLikeNodeType(joint, current);
                    let node = new css_node_1.CSSTokenNode(type, joint, current, latestComment);
                    current.children.push(node);
                    current = node;
                    notDetermined = [];
                    latestComment = null;
                }
            }
            else if (token.type === scanners_1.CSSTokenType.ClosureEnd) {
                if (notDetermined.length > 0) {
                    parseNotDetermined(true);
                }
                current.defEnd = token.end;
                current = current.parent ?? tree;
            }
            else if (token.type === scanners_1.CSSTokenType.CommentText) {
                if (notDetermined.length === 0) {
                    latestComment = token;
                }
            }
        }
        // Although has no `{` followed, still parse it as selector.
        if (notDetermined.length > 0) {
            parseNotDetermined(true);
        }
        return tree;
    }
    /**
     * For property name part.
     * Be static for also parsing inline style.
     */
    static *parsePropertyNamePart(text, start, commentText, valueText) {
        if (text.startsWith('-')) {
            // Will not set defEnd to value end, because default vscode plugin will
            // also generate a definition, but end with property name end.
            yield new parts_1.CSSVariableDefinitionPart(text, start, commentText, valueText);
        }
    }
    /**
     * For property value part.
     * Be static for also parsing inline style.
     */
    static *parsePropertyValuePart(text, start) {
        let varMatches = picker_1.Picker.locateAllMatches(text, /var\(\s*([\w-]*)\s*\)|^\s*(-[\w-]*)|(--[\w-]*)/g);
        for (let match of varMatches) {
            // `var()`, can't find captured match.
            if (!match[1]) {
                yield new parts_1.Part(parts_1.PartType.CSSVariableReference, '', match[0].start + 4 + start);
            }
            else if (match[0].text.startsWith('var')) {
                yield new parts_1.Part(parts_1.PartType.CSSVariableReference, match[1].text, match[1].start + start);
            }
            // `color: --name`, only for completion.
            else {
                yield new parts_1.Part(parts_1.PartType.CSSVariableReferenceNoVar, match[1].text, match[1].start + start);
            }
        }
    }
    string;
    languageId;
    nodePartMap = new utils_2.ListMap();
    commandWrappedMap = new Map();
    constructor(string, languageId) {
        super(css_node_1.CSSTokenNodeType.Root, {
            type: scanners_1.CSSTokenType.NotDetermined,
            text: '',
            start: -1,
            end: -1,
        }, null);
        this.string = string;
        this.languageId = languageId;
    }
    /**
     * Walk all the parts.
     * Note it ignores all non-primary selectors.
     */
    *walkParts() {
        for (let node of this.walk()) {
            yield* this.parseNodePart(node);
        }
    }
    *parseNodePart(node) {
        if (node.isRoot()) {
            return;
        }
        if (node.type === css_node_1.CSSTokenNodeType.Selector) {
            yield* this.parseSelectorPart(node);
        }
        else if (node.type === css_node_1.CSSTokenNodeType.PropertyName) {
            yield* this.parsePropertyNamePart(node);
        }
        else if (node.type === css_node_1.CSSTokenNodeType.PropertyValue) {
            yield* this.parsePropertyValuePart(node);
        }
        else if (node.type === css_node_1.CSSTokenNodeType.Command) {
            yield* this.parseCommandPart(node);
        }
    }
    /** Parse a selector string to parts. */
    *parseSelectorPart(node) {
        yield* this.parseSelectorString(node.token.text, node.token.start, node, false);
    }
    /** For property name part. */
    *parsePropertyNamePart(node) {
        let text = node.token.text;
        if (!text.startsWith('-')) {
            return;
        }
        let commentText = node.commentToken?.text;
        let nextNode = node.getNextSibling();
        // CSS Variable value.
        let cssVariableValue = nextNode && nextNode.type === css_node_1.CSSTokenNodeType.PropertyValue
            ? nextNode.token.text
            : undefined;
        // Will not set defEnd to value end, because default vscode plugin will
        // also generate a definition, but end with property name end.
        yield* CSSTokenTree.parsePropertyNamePart(text, node.token.start, commentText, cssVariableValue);
    }
    /** For property value part. */
    *parsePropertyValuePart(node) {
        yield* CSSTokenTree.parsePropertyValuePart(node.token.text, node.token.start);
    }
    /** Parse a selector content to parts. */
    *parseSelectorString(text, start, node, breaksSeparatorNesting) {
        let groups = new scanners_1.CSSSelectorTokenScanner(text, start, this.languageId).parseToSeparatedTokens();
        let parentParts = this.nodePartMap.get(node.parent);
        let commandWrapped = node.parent ? !!this.commandWrappedMap.get(node.parent) : false;
        for (let group of groups) {
            let joint = (0, utils_1.joinTokens)(group, this.string);
            let part = parts_2.CSSSelectorWrapperPart.parseFrom(joint, group, parentParts, breaksSeparatorNesting, node.defEnd, commandWrapped, node.commentToken?.text);
            yield part;
            this.nodePartMap.add(node, part);
        }
        // Broadcast wrapped to children.
        this.commandWrappedMap.set(node, commandWrapped);
    }
    /** Parse a command string to parts. */
    *parseCommandPart(node) {
        let commandName = getCommandName(node.token.text);
        // See https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Nesting_at-rules
        if (commandName === 'media'
            || commandName === 'supports'
            || commandName === 'layer'
            || commandName === 'scope'
            || commandName === 'container') {
            let parentParts = this.nodePartMap.get(node.parent);
            if (parentParts) {
                this.nodePartMap.set(node, parentParts);
            }
        }
        if (commandName === 'import') {
            // `@import ''`.
            // `class={style['class-name']}`.
            let match = picker_1.Picker.locateMatches(node.token.text, /@import\s+['"](.+?)['"]/);
            if (match) {
                yield new parts_1.Part(parts_1.PartType.CSSImportPath, match[1].text, match[1].start + node.token.start);
            }
        }
        else if (commandName === 'at-root') {
            // `@at-root .class`.
            let selectorMatch = picker_1.Picker.locateMatches(node.token.text, /@at-root\s+(.+)/);
            if (selectorMatch) {
                yield* this.parseSelectorString(selectorMatch[1].text, selectorMatch[1].start + node.token.start, node, true);
            }
        }
        else if (commandName === 'keyframes') {
            yield new parts_1.Part(parts_1.PartType.CSSImportPath, node.token.text, node.token.start, node.defEnd).trim();
        }
        this.commandWrappedMap.set(node, true);
    }
}
exports.CSSTokenTree = CSSTokenTree;
function isCommandToken(token) {
    return /^\s*@/.test(token.text);
}
function getCommandName(text) {
    return text.match(/@([\w-]+)/)?.[1];
}
function getSelectorLikeNodeType(token, current) {
    if (current.type === css_node_1.CSSTokenNodeType.Command && getCommandName(current.token.text) === 'keyframes') {
        return css_node_1.CSSTokenNodeType.ClosureName;
    }
    else if (isCommandToken(token)) {
        return css_node_1.CSSTokenNodeType.Command;
    }
    else {
        return css_node_1.CSSTokenNodeType.Selector;
    }
}
function splitPropertyTokens(token) {
    // Here ignores comments.
    let match = picker_1.Picker.locateMatches(token.text, /([\w-]+)\s*:\s*(.+?)\s*$/);
    if (!match) {
        return null;
    }
    let name = {
        type: scanners_1.CSSTokenType.NotDetermined,
        text: match[1].text,
        start: token.start + match[1].start,
        end: token.start + match[1].start + match[1].text.length,
    };
    let value = {
        type: scanners_1.CSSTokenType.NotDetermined,
        text: match[2].text,
        start: token.start + match[2].start,
        end: token.start + match[2].start + match[2].text.length,
    };
    return [name, value];
}
//# sourceMappingURL=css-tree.js.map