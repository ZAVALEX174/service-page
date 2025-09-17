"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionLabels = exports.CompletionLabelType = void 0;
const part_1 = require("./part");
const vscode_languageserver_1 = require("vscode-languageserver");
const part_convertor_1 = require("./part-convertor");
const utils_1 = require("../../utils");
var CompletionLabelType;
(function (CompletionLabelType) {
    CompletionLabelType[CompletionLabelType["CSSVariable"] = 0] = "CSSVariable";
    CompletionLabelType[CompletionLabelType["Definition"] = 1] = "Definition";
    CompletionLabelType[CompletionLabelType["Reference"] = 2] = "Reference";
})(CompletionLabelType || (exports.CompletionLabelType = CompletionLabelType = {}));
/** Merge several groups of completion labels. */
class CompletionLabels {
    typeMap = new Map();
    detailMap = new Map();
    add(type, labelMap) {
        for (let [label, detail] of labelMap) {
            if (!this.typeMap.has(label) || this.typeMap.get(label) < type) {
                this.typeMap.set(label, type);
                this.detailMap.set(label, detail);
            }
        }
    }
    remove(labels) {
        for (let label of labels) {
            this.typeMap.delete(label);
            // No need to delete details, wait them to be GC.
        }
    }
    /** If `forceForOffset` specified, reset text edit to this offset. */
    output(fromPart, document, forceEditCollapseToOffset = undefined) {
        let items = [];
        let collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base', ignorePunctuation: true });
        let sortedLabels = [...this.typeMap.keys()].sort(collator.compare);
        for (let i = 0; i < sortedLabels.length; i++) {
            let kind;
            let label = sortedLabels[i];
            let type = this.typeMap.get(label);
            if (type === CompletionLabelType.CSSVariable) {
                kind = vscode_languageserver_1.CompletionItemKind.Variable;
            }
            else if (type === CompletionLabelType.Definition) {
                kind = vscode_languageserver_1.CompletionItemKind.Class;
            }
            else {
                kind = vscode_languageserver_1.CompletionItemKind.Value;
            }
            let value = this.detailMap.get(label);
            let detail = value;
            if (type === CompletionLabelType.CSSVariable && value) {
                let color = utils_1.Color.fromString(value);
                if (color) {
                    kind = vscode_languageserver_1.CompletionItemKind.Color;
                    detail = color.toHEX();
                }
            }
            // Use space because it's char code is 32, lower than any other visible characters.
            let sortText = ' ' + String(i).padStart(3, '0');
            let insertText = label;
            // `--name` -> `var(--name)`
            if (fromPart.type === part_1.PartType.CSSVariableReferenceNoVar) {
                insertText = `var(${label})`;
            }
            // Reset text edit collapse to the specified offset.
            let range = part_convertor_1.PartConvertor.toRange(fromPart, document);
            if (forceEditCollapseToOffset !== undefined) {
                range.start = range.end = document.positionAt(forceEditCollapseToOffset);
            }
            let textEdit = vscode_languageserver_1.TextEdit.replace(part_convertor_1.PartConvertor.toRange(fromPart, document), insertText);
            let item = {
                kind,
                label,
                detail,
                sortText,
                textEdit,
            };
            items.push(item);
        }
        return items;
    }
}
exports.CompletionLabels = CompletionLabels;
//# sourceMappingURL=completion-labels.js.map