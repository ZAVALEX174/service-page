"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSSelectorDetailedPart = void 0;
exports.parseDetailedParts = parseDetailedParts;
const scanners_1 = require("../scanners");
const part_1 = require("./part");
const part_convertor_1 = require("./part-convertor");
/** Detailed part, normally contains a tag/class/id selector. */
class CSSSelectorDetailedPart extends part_1.Part {
    /**
     * Formatted selector name can be used for workspace symbol searching.
     * `&-name` -> `.parent-name`
     */
    formatted;
    /** Whether current part is primary part. */
    primary;
    /**
     * Whether current selector is the main selector,
     * which means it has no other unioned selectors,
     * and not been nested like `.a .b`,
     * and not been wrapped by commands.
     */
    independent;
    constructor(type, text, start, definitionEnd, formatted, primary, independent) {
        super(type, text, start, definitionEnd);
        this.formatted = formatted;
        this.primary = primary;
        this.independent = independent;
    }
    isTextMatch(matchPart) {
        return this.formatted.some(text => text === matchPart.text);
    }
    isTextExpMatch(re) {
        return this.formatted.some(text => re.test(text));
    }
}
exports.CSSSelectorDetailedPart = CSSSelectorDetailedPart;
/** Parse a CSS selector name to detailed part. */
function parseDetailedParts(group, parents, definitionEnd, commandWrapped) {
    let detailedTokens = group.filter(item => item.type === scanners_1.CSSSelectorTokenType.Tag
        || item.type === scanners_1.CSSSelectorTokenType.Nesting
        || item.type === scanners_1.CSSSelectorTokenType.Class
        || item.type === scanners_1.CSSSelectorTokenType.Id);
    let primaryToken = detailedTokens.length > 0 ? detailedTokens[detailedTokens.length - 1] : null;
    let primaryTokenIndex = primaryToken ? group.lastIndexOf(primaryToken) : -1;
    // Has combinator or separator followed.
    // `a b` -> `b`
    // `a + b` -> `b`
    // `a:hover` -> `a`
    // `.a.b` -> `.b`
    // `.a::before` -> `null`
    if (primaryTokenIndex !== -1) {
        for (let i = primaryTokenIndex + 1; i < group.length; i++) {
            let item = group[i];
            if (item.type === scanners_1.CSSSelectorTokenType.Combinator
                || item.type === scanners_1.CSSSelectorTokenType.Separator
                || item.type === scanners_1.CSSSelectorTokenType.PseudoElement) {
                primaryToken = null;
                break;
            }
        }
    }
    let details = [];
    let independent = commandWrapped || group.length === 1;
    for (let token of detailedTokens) {
        let formatted = joinMainReferenceSelectorWithParent(token, parents);
        if (formatted.length === 0) {
            continue;
        }
        let type = getDetailedPartType(token.type, formatted);
        let primary = token === primaryToken;
        let part = new CSSSelectorDetailedPart(type, token.text, token.start, definitionEnd, formatted, primary, independent);
        details.push(part);
    }
    return details;
}
/** Join parent selectors, but only handle `&-` joining. */
function joinMainReferenceSelectorWithParent(token, parents) {
    let text = token.text;
    let re = /&/g;
    // `a{&-b}` -> `a-b`, not handle joining multiply & when several `&` exist.
    if (re.test(text)) {
        if (!parents) {
            return [text];
        }
        let joint = [];
        for (let parent of parents) {
            if (!parent.primary) {
                continue;
            }
            for (let primaryFormatted of parent.primary.formatted) {
                joint.push(text.replace(re, primaryFormatted));
            }
        }
        return joint;
    }
    else {
        return [text];
    }
}
/** Get part type by detailed token type, and formatted text. */
function getDetailedPartType(type, formatted) {
    if (type === scanners_1.CSSSelectorTokenType.Tag) {
        return part_1.PartType.CSSSelectorTag;
    }
    else if (type === scanners_1.CSSSelectorTokenType.Id) {
        return part_1.PartType.CSSSelectorId;
    }
    else if (type === scanners_1.CSSSelectorTokenType.Class) {
        return part_1.PartType.CSSSelectorClass;
    }
    else {
        return part_convertor_1.PartConvertor.getCSSSelectorDetailedTypeByText(formatted[0]);
    }
}
//# sourceMappingURL=part-css-selector-detailed.js.map