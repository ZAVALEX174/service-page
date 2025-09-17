"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartComparer = void 0;
const part_convertor_1 = require("./part-convertor");
/**
 * Compare two parts,
 * especially to find definitions or references.
 */
var PartComparer;
(function (PartComparer) {
    /** Get formatted list for css selector, or text. */
    function mayFormatted(part) {
        if (part.hasFormattedList()) {
            return part.formatted;
        }
        else {
            return [part.text];
        }
    }
    PartComparer.mayFormatted = mayFormatted;
    /** Get details list for css selector, or self as list. */
    function mayDetails(part) {
        if (part.isSelectorWrapperType()) {
            return part.details;
        }
        else {
            return [part];
        }
    }
    PartComparer.mayDetails = mayDetails;
    /** Whether text of a part is totally match another part. */
    function isTextMatch(part1, part2) {
        return part1.text === part2.text;
    }
    PartComparer.isTextMatch = isTextMatch;
    /** Whether one part text list matches another part. */
    function isMayFormattedListMatch(testPart, matchPart) {
        if (testPart.hasFormattedList()) {
            return testPart.formatted.some(text => text === matchPart.text);
        }
        else {
            return testPart.text === matchPart.text;
        }
    }
    PartComparer.isMayFormattedListMatch = isMayFormattedListMatch;
    /**
     * Whether part text is wild match an regexp.
     * Use it for finding workspace symbol.
     */
    function isTextExpMatch(testPart, re) {
        return re.test(testPart.text);
    }
    PartComparer.isTextExpMatch = isTextExpMatch;
    /** Whether one part text list matches another part. */
    function isMayFormattedListExpMatch(testPart, re) {
        if (testPart.hasFormattedList()) {
            return testPart.formatted.some(text => re.test(text));
        }
        else {
            return re.test(testPart.text);
        }
    }
    PartComparer.isMayFormattedListExpMatch = isMayFormattedListExpMatch;
    /**
     * Whether type of like HTML reference part matches type of a CSS definition part.
     * Use it for finding references and do class name completions for a css document.
     * Note this will match type of it's own.
     */
    function isReferenceTypeMatch(testType, matchDefType) {
        return part_convertor_1.PartConvertor.typeToDefinition(testType) === matchDefType;
    }
    PartComparer.isReferenceTypeMatch = isReferenceTypeMatch;
    /**
     * Whether text of like HTML reference part matches a CSS definition text list.
     * Use it for finding references.
     */
    function isReferenceTextMatch(testPart, matchType, matchTexts) {
        return PartComparer.mayFormatted(testPart).some(text => {
            return matchTexts.includes(part_convertor_1.PartConvertor.textToType(text, testPart.type, matchType));
        });
    }
    PartComparer.isReferenceTextMatch = isReferenceTextMatch;
})(PartComparer || (exports.PartComparer = PartComparer = {}));
//# sourceMappingURL=part-comparer.js.map