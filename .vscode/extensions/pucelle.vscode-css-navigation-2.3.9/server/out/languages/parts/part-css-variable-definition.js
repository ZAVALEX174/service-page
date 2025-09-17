"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSVariableDefinitionPart = void 0;
const part_1 = require("./part");
/**
 * CSS Variable Declaration Part represents a css variable declaration,
 * remember it's variable value, and comment.
 */
class CSSVariableDefinitionPart extends part_1.Part {
    /** Previous comment text. */
    comment;
    /** Variable value text. */
    value;
    constructor(label, start, comment, value) {
        super(part_1.PartType.CSSVariableDefinition, label, start, -1);
        this.comment = comment;
        this.value = value;
    }
}
exports.CSSVariableDefinitionPart = CSSVariableDefinitionPart;
//# sourceMappingURL=part-css-variable-definition.js.map