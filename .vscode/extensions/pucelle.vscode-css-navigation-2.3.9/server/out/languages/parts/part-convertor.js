"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartConvertor = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const utils_1 = require("../trees/utils");
const part_1 = require("./part");
const css_tree_1 = require("../trees/css-tree");
const css_node_1 = require("../trees/css-node");
const part_comparer_1 = require("./part-comparer");
const utils_2 = require("../../utils");
/** Help to convert part type and text. */
var PartConvertor;
(function (PartConvertor) {
    /** Get css part type from text which includes identifiers like `.`, `#`. */
    function getCSSSelectorDetailedTypeByText(text) {
        if (text[0] === '#') {
            return part_1.PartType.CSSSelectorId;
        }
        else if (text[0] === '.') {
            return part_1.PartType.CSSSelectorClass;
        }
        else {
            return part_1.PartType.CSSSelectorTag;
        }
    }
    PartConvertor.getCSSSelectorDetailedTypeByText = getCSSSelectorDetailedTypeByText;
    /** `ab` -> /\bab/i. */
    function makeWordStartsMatchExp(text) {
        if (/^[a-z]/i.test(text)) {
            return new RegExp('\\b' + (0, utils_1.escapeAsRegExpSource)(text), 'i');
        }
        else {
            return new RegExp((0, utils_1.escapeAsRegExpSource)(text), 'i');
        }
    }
    PartConvertor.makeWordStartsMatchExp = makeWordStartsMatchExp;
    /** `ab` -> /^ab/i. */
    function makeStartsMatchExp(text) {
        return new RegExp('^' + (0, utils_1.escapeAsRegExpSource)(text), 'i');
    }
    PartConvertor.makeStartsMatchExp = makeStartsMatchExp;
    /** `ab` -> /^\.?ab/i. */
    function makeIdentifiedStartsMatchExp(texts, type) {
        if (type === part_1.PartType.Id
            || type === part_1.PartType.CSSSelectorId
            || type === part_1.PartType.CSSSelectorQueryId) {
            // Removes `#`
            texts = texts.map(text => textToType(text, type, part_1.PartType.Id));
            return new RegExp('^\\#?(?:' + texts.map(text => (0, utils_1.escapeAsRegExpSource)(text)).join('|') + ')', 'i');
        }
        else if (type === part_1.PartType.Class
            || type === part_1.PartType.CSSSelectorClass
            || type === part_1.PartType.CSSSelectorQueryClass) {
            // Removes `.`
            texts = texts.map(text => textToType(text, type, part_1.PartType.Class));
            return new RegExp('^\\.?(?:' + texts.map(text => (0, utils_1.escapeAsRegExpSource)(text)).join('|') + ')', 'i');
        }
        else {
            return new RegExp('^(?:' + texts.map(text => (0, utils_1.escapeAsRegExpSource)(text)).join('|') + ')', 'i');
        }
    }
    PartConvertor.makeIdentifiedStartsMatchExp = makeIdentifiedStartsMatchExp;
    /** Convert text to from specified part type, to target part type. */
    function textToType(text, fromType, toType) {
        if (fromType === toType) {
            return text;
        }
        if (fromType === part_1.PartType.Id) {
            if (toType === part_1.PartType.CSSSelectorId || toType === part_1.PartType.CSSSelectorQueryId) {
                text = '#' + text;
            }
        }
        else if (fromType === part_1.PartType.CSSSelectorId || fromType === part_1.PartType.CSSSelectorQueryId) {
            if (toType === part_1.PartType.Id) {
                text = text.slice(1);
            }
        }
        else if (fromType === part_1.PartType.Class
            || fromType === part_1.PartType.ReactDefaultImportedCSSModuleClass
            || fromType === part_1.PartType.ReactImportedCSSModuleProperty) {
            if (toType === part_1.PartType.CSSSelectorQueryClass || toType === part_1.PartType.CSSSelectorClass) {
                text = '.' + text;
            }
        }
        else if (fromType === part_1.PartType.CSSSelectorQueryClass
            || fromType === part_1.PartType.CSSSelectorClass) {
            if (toType === part_1.PartType.Class
                || toType === part_1.PartType.ReactDefaultImportedCSSModuleClass
                || toType === part_1.PartType.ReactImportedCSSModuleProperty) {
                text = text.slice(1);
            }
        }
        else if (fromType === part_1.PartType.ClassPotential) {
            text = '';
        }
        return text;
    }
    PartConvertor.textToType = textToType;
    /** Convert type to definition part type. */
    function typeToDefinition(type) {
        if (type === part_1.PartType.Tag) {
            return part_1.PartType.CSSSelectorTag;
        }
        else if (type === part_1.PartType.Id) {
            return part_1.PartType.CSSSelectorId;
        }
        else if (type === part_1.PartType.Class || type === part_1.PartType.ClassPotential) {
            return part_1.PartType.CSSSelectorClass;
        }
        else if (type === part_1.PartType.CSSSelectorQueryTag) {
            return part_1.PartType.CSSSelectorTag;
        }
        else if (type === part_1.PartType.CSSSelectorQueryId) {
            return part_1.PartType.CSSSelectorId;
        }
        else if (type === part_1.PartType.CSSSelectorQueryClass) {
            return part_1.PartType.CSSSelectorClass;
        }
        else if (type === part_1.PartType.CSSVariableAssignment
            || type === part_1.PartType.CSSVariableReference
            || type === part_1.PartType.CSSVariableReferenceNoVar) {
            return part_1.PartType.CSSVariableDefinition;
        }
        else if (type === part_1.PartType.ReactDefaultImportedCSSModuleClass
            || type === part_1.PartType.ReactImportedCSSModuleProperty) {
            return part_1.PartType.CSSSelectorClass;
        }
        return type;
    }
    PartConvertor.typeToDefinition = typeToDefinition;
    /**
     * Transform a part to definition type, normally use it for definition matching.
     * This is only one definition type mapped to several reference types,
     * so can transform to definition mode to make comparing faster.
     */
    function toDefinitionMode(part) {
        let type = PartConvertor.typeToDefinition(part.type);
        let text = PartConvertor.textToType(part.text, part.type, type);
        return new part_1.Part(type, text, -1, -1);
    }
    PartConvertor.toDefinitionMode = toDefinitionMode;
    /** Get a range from its related document. */
    function toRange(part, document) {
        return vscode_languageserver_1.Range.create(document.positionAt(part.start), document.positionAt(part.end));
    }
    PartConvertor.toRange = toRange;
    /** To a location link for going to definition. */
    function toLocationLink(part, document, fromPart, fromDocument) {
        let selectionRange = toRange(part, document);
        let end = part.defEnd > -1 ? part.defEnd : part.end;
        // Selection range doesn't work as expected, finally cursor move to definition start.
        let definitionRange = vscode_languageserver_1.Range.create(selectionRange.start, document.positionAt(end));
        let fromRange = toRange(fromPart, fromDocument);
        return vscode_languageserver_1.LocationLink.create(document.uri, definitionRange, selectionRange, fromRange);
    }
    PartConvertor.toLocationLink = toLocationLink;
    /** To a location for finding references. */
    function toLocation(part, document) {
        return vscode_languageserver_1.Location.create(document.uri, toRange(part, document));
    }
    PartConvertor.toLocation = toLocation;
    /** To several symbol information for workspace symbol searching. */
    function toSymbolInformationList(part, document) {
        let kind = part.type === part_1.PartType.CSSSelectorWrapper
            || part.type === part_1.PartType.CSSSelectorTag
            || part.type === part_1.PartType.CSSSelectorClass
            || part.type === part_1.PartType.CSSSelectorId
            ? vscode_languageserver_1.SymbolKind.Class
            : vscode_languageserver_1.SymbolKind.Variable;
        let textList = part_comparer_1.PartComparer.mayFormatted(part);
        return textList.map(text => vscode_languageserver_1.SymbolInformation.create(text, kind, toRange(part, document), document.uri));
    }
    PartConvertor.toSymbolInformationList = toSymbolInformationList;
    /** Selector part to hover. */
    function toHoverOfSelectorWrapper(part, fromPart, document, fromDocument, maxStylePropertyCount) {
        let comment = part.comment?.trim();
        let content = '```css\n' + part_comparer_1.PartComparer.mayFormatted(part)[0] + ' {';
        if (maxStylePropertyCount > 0) {
            content += parseStyleProperties(part, document.getText(), maxStylePropertyCount);
        }
        else {
            content += '...';
        }
        content += '}\n```';
        if (comment) {
            content += '\n' + comment;
        }
        return {
            contents: {
                kind: vscode_languageserver_1.MarkupKind.Markdown,
                value: content,
            },
            range: toRange(fromPart, fromDocument),
        };
    }
    PartConvertor.toHoverOfSelectorWrapper = toHoverOfSelectorWrapper;
    function parseStyleProperties(part, string, maxStylePropertyCount) {
        let text = string.slice(part.start, part.defEnd);
        let tree = css_tree_1.CSSTokenTree.fromString(text, 0, 'css');
        let content = '';
        let count = 0;
        let hasAdditional = false;
        let selectorNode = tree.children.find(child => child.type === css_node_1.CSSTokenNodeType.Selector);
        if (!selectorNode) {
            return '...';
        }
        for (let child of selectorNode.children) {
            if (count === maxStylePropertyCount) {
                hasAdditional = true;
                break;
            }
            if (child.type === css_node_1.CSSTokenNodeType.PropertyName) {
                content += '\n\t' + child.token.text.trim();
            }
            else if (child.type === css_node_1.CSSTokenNodeType.PropertyValue) {
                content += ': ' + child.token.text.trim() + ';';
                count++;
            }
            else {
                hasAdditional = true;
                break;
            }
        }
        if (hasAdditional) {
            if (count > 0) {
                content += '\n\t...\n';
            }
            else {
                content += '...';
            }
        }
        else {
            content += '\n';
        }
        return content;
    }
    /** CSS Variable definition part to hover. */
    function toHoverOfCSSVariableDefinition(part, fromPart, fromDocument) {
        let comment = part.comment?.trim();
        let value = part.value?.trim();
        let content = '';
        if (value) {
            content += 'Value: ' + value;
        }
        if (comment) {
            content += '\n\n' + comment;
        }
        return {
            contents: {
                kind: vscode_languageserver_1.MarkupKind.Markdown,
                value: content,
            },
            range: toRange(fromPart, fromDocument),
        };
    }
    PartConvertor.toHoverOfCSSVariableDefinition = toHoverOfCSSVariableDefinition;
    /** CSS Variable part to color information. */
    function toColorInformation(part, value, fromDocument) {
        let color = utils_2.Color.fromString(value);
        if (!color) {
            return null;
        }
        return {
            color: vscode_languageserver_1.Color.create(color.r, color.g, color.b, color.a),
            range: toRange(part, fromDocument),
        };
    }
    PartConvertor.toColorInformation = toColorInformation;
})(PartConvertor || (exports.PartConvertor = PartConvertor = {}));
//# sourceMappingURL=part-convertor.js.map