"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSSelectorWrapperPart = void 0;
const part_1 = require("./part");
const part_css_selector_detailed_1 = require("./part-css-selector-detailed");
/**
 * Part is normally a tag/class/id selector, or a css variable.
 * For Quick Info and workspace symbol searching.
 */
class CSSSelectorWrapperPart extends part_1.Part {
    static parseFrom(jointToken, group, parents, breaksSeparatorNesting, definitionEnd, commandWrapped, comment) {
        let formatted = parseFormatted(jointToken, parents, breaksSeparatorNesting);
        let details = (0, part_css_selector_detailed_1.parseDetailedParts)(group, parents, definitionEnd, commandWrapped);
        return new CSSSelectorWrapperPart(jointToken.text, jointToken.start, definitionEnd, comment, formatted, details);
    }
    /** Previous comment text. */
    comment;
    /**
     * Formatted selector full name can be used for workspace symbol searching.
     * `&-name` -> `.parent-name`
     */
    formatted;
    /** Detailed parts, use it for completion */
    details;
    /** Primary parts can be used for definition searching. */
    primary;
    constructor(text, start, defEnd, comment, formatted, details) {
        super(part_1.PartType.CSSSelectorWrapper, text, start, defEnd);
        this.comment = comment;
        this.formatted = formatted;
        this.details = details;
        this.primary = details.find(d => d.primary);
    }
    get textList() {
        return this.formatted;
    }
}
exports.CSSSelectorWrapperPart = CSSSelectorWrapperPart;
/** Join parent selectors. */
function parseFormatted(jointToken, parents, breaksSeparatorNesting) {
    return joinSelectorWithParent(jointToken, parents, breaksSeparatorNesting);
}
/** Join parent selectors. */
function joinSelectorWithParent(token, parents, breaksSeparatorNesting) {
    let text = token.text;
    let re = /&/g;
    if (!parents || parents.length === 0) {
        return [text];
    }
    // `a{&-b}` -> `a-b`.
    if (re.test(text)) {
        let joint = [];
        for (let parent of parents) {
            for (let parentText of parent.formatted) {
                joint.push(text.replace(re, parentText));
            }
        }
        return joint;
    }
    // `a{b}` -> `a b`.
    else if (!breaksSeparatorNesting) {
        let joint = [];
        for (let parent of parents) {
            for (let parentText of parent.formatted) {
                joint.push(parentText + ' ' + text);
            }
        }
        return joint;
    }
    // `a{@at-root b}` -> `b`
    else {
        return [text];
    }
}
//# sourceMappingURL=part-css-selector-wrapper.js.map