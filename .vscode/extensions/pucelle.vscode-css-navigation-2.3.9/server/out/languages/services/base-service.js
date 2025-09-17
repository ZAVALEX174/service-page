"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const resolver_1 = require("../resolver");
const parts_1 = require("../parts");
const utils_1 = require("../utils");
const vscode_uri_1 = require("vscode-uri");
/** Base of HTML or CSS service for one file. */
class BaseService {
    document;
    parts;
    /** Contains primary selector part, bot not all details. */
    partMap;
    resolvedImportedCSSPaths = undefined;
    constructor(document) {
        this.document = document;
        let tree = this.makeTree();
        this.parts = [...tree.walkParts()];
        this.partMap = (0, utils_1.groupBy)(this.parts, part => [part.type, part]);
        let selectorParts = this.partMap.get(parts_1.PartType.CSSSelectorWrapper);
        if (selectorParts) {
            this.partMap.set(parts_1.PartType.CSSSelectorTag, []);
            this.partMap.set(parts_1.PartType.CSSSelectorClass, []);
            this.partMap.set(parts_1.PartType.CSSSelectorId, []);
            for (let part of selectorParts) {
                for (let detail of part.details) {
                    this.partMap.get(detail.type).push(detail);
                }
            }
        }
    }
    /** Get part list by part type. */
    getPartsByType(type) {
        return this.partMap.get(type) || [];
    }
    /** Get resolved import CSS file paths. */
    async getImportedCSSPaths() {
        // How low rate to resolving for twice, no matter.
        if (this.resolvedImportedCSSPaths) {
            return this.resolvedImportedCSSPaths;
        }
        let paths = [];
        for (let part of this.getPartsByType(parts_1.PartType.CSSImportPath)) {
            // Must have no protocol.
            if (/^\w+:/.test(part.text)) {
                continue;
            }
            let path = await resolver_1.PathResolver.resolveDocumentPath(part.text, this.document);
            if (path) {
                paths.push(path);
            }
        }
        return this.resolvedImportedCSSPaths = paths;
    }
    /** Get resolved import CSS uris. */
    async getImportedCSSURIs() {
        let paths = await this.getImportedCSSPaths();
        let uris = paths.map(path => vscode_uri_1.URI.file(path).toString());
        return uris;
    }
    /**
     * Find a part at specified offset.
     * Note it nerve get detailed part.
     */
    findPartAt(offset) {
        let part = (0, utils_1.quickBinaryFind)(this.parts, (part) => {
            if (part.start > offset) {
                return 1;
            }
            else if (part.end < offset) {
                return -1;
            }
            else {
                return 0;
            }
        });
        return part;
    }
    /**
     * Find a part at specified offset.
     * Note if match a css selector part, it may return a selector detail part.
     */
    findDetailedPartAt(offset) {
        let part = this.findPartAt(offset);
        // Returns detail if in range.
        if (part && part.type === parts_1.PartType.CSSSelectorWrapper) {
            let details = part.details;
            for (let detail of details) {
                if (detail
                    && detail.start <= offset
                    && detail.end >= offset) {
                    return detail;
                }
            }
            return undefined;
        }
        return part;
    }
    /**
     * Find previous sibling part before current.
     * Not it will not look up detailed parts.
     */
    findPreviousPart(part) {
        let partIndex = (0, utils_1.quickBinaryFindIndex)(this.parts, p => {
            return p.start - part.start;
        });
        if (partIndex <= 0) {
            return null;
        }
        return this.parts[partIndex - 1];
    }
    /**
     * Find definitions match part.
     * `matchDefPart` must have been converted to definition type.
     */
    findDefinitions(matchDefPart, fromPart, fromDocument) {
        let locations = [];
        for (let part of this.getPartsByType(matchDefPart.type)) {
            if (!parts_1.PartComparer.isMayFormattedListMatch(part, matchDefPart)) {
                continue;
            }
            // Not match non-primary detailed.
            if (part.isSelectorDetailedType() && !part.primary) {
                continue;
            }
            // `.a{&:hover}`, `&` not match `.a` because it reference parent completely.
            if (part.text === '&') {
                continue;
            }
            locations.push(parts_1.PartConvertor.toLocationLink(part, this.document, fromPart, fromDocument));
        }
        return locations;
    }
    /**
     * Query symbols from a wild match part.
     *
     * Query string 'p' will match:
     *	p* as tag name
     *	.p* as class name
     *	#p* as id
     * and may have more decorated selectors followed.
     */
    findSymbols(query) {
        let symbols = [];
        let re = parts_1.PartConvertor.makeWordStartsMatchExp(query);
        for (let part of this.parts) {
            // Match text list with regexp, not match type.
            if (!parts_1.PartComparer.isMayFormattedListExpMatch(part, re)) {
                continue;
            }
            symbols.push(...parts_1.PartConvertor.toSymbolInformationList(part, this.document));
        }
        return symbols;
    }
    /**
     * Get completion labels match part.
     * `matchDefPart` must have been converted to definition type.
     */
    getCompletionLabels(matchPart, fromPart) {
        let labelMap = new Map();
        let re = parts_1.PartConvertor.makeStartsMatchExp(matchPart.text);
        for (let part of this.getPartsByType(matchPart.type)) {
            // Now allow to complete itself.
            if (part === fromPart) {
                continue;
            }
            if (!parts_1.PartComparer.isMayFormattedListExpMatch(part, re)) {
                continue;
            }
            // Show variable details.
            if (part.type === parts_1.PartType.CSSVariableDefinition) {
                labelMap.set(part.text, part.value);
            }
            else {
                // Convert text from current type to original type.
                for (let text of parts_1.PartComparer.mayFormatted(part)) {
                    let label = parts_1.PartConvertor.textToType(text, matchPart.type, fromPart.type);
                    labelMap.set(label, undefined);
                }
            }
        }
        return labelMap;
    }
    /**
     * Get completion labels match part.
     * The difference with `getCompletionLabels` is that
     * `fromPart` is a definition part like class name selector,
     * but current parts are reference types of parts.
     */
    getReferencedCompletionLabels(fromPart) {
        let labelMap = new Map();
        let re = parts_1.PartConvertor.makeIdentifiedStartsMatchExp(parts_1.PartComparer.mayFormatted(fromPart), fromPart.type);
        let matchDefPart = parts_1.PartConvertor.toDefinitionMode(fromPart);
        for (let type of this.partMap.keys()) {
            // Filter by type.
            if (!parts_1.PartComparer.isReferenceTypeMatch(type, matchDefPart.type)) {
                continue;
            }
            for (let part of this.getPartsByType(type)) {
                // Now allow to complete itself.
                if (part === fromPart) {
                    continue;
                }
                // Filter by text.
                if (!parts_1.PartComparer.isMayFormattedListExpMatch(part, re)) {
                    continue;
                }
                for (let text of parts_1.PartComparer.mayFormatted(part)) {
                    // Replace back from `a-b` to `&-b`.
                    let mayNestedText = parts_1.PartConvertor.textToType(text, part.type, fromPart.type).replace(re, fromPart.text);
                    if (mayNestedText === text) {
                        labelMap.set(mayNestedText, undefined);
                    }
                    else {
                        labelMap.set(mayNestedText, text);
                    }
                }
            }
        }
        return labelMap;
    }
    /**
     * Find the reference locations in the HTML document from a class or id selector.
     * `matchDefPart` must have been converted to definition type.
     */
    findReferences(matchDefPart, fromPart) {
        let locations = [];
        // Important, use may formatted text, and also must use definition text.
        let texts = fromPart.hasFormattedList() ? parts_1.PartComparer.mayFormatted(fromPart) : [matchDefPart.text];
        for (let type of this.partMap.keys()) {
            // Filter by type.
            if (!parts_1.PartComparer.isReferenceTypeMatch(type, matchDefPart.type)) {
                continue;
            }
            for (let part of this.getPartsByType(type)) {
                // No include from part.
                // Beware this will cause some reference tests can't pass because of the build-in reference.
                // if (part === fromPart) {
                // 	continue
                // }
                // Filter by text.
                if (!parts_1.PartComparer.isReferenceTextMatch(part, matchDefPart.type, texts)) {
                    continue;
                }
                locations.push(parts_1.PartConvertor.toLocation(part, this.document));
            }
        }
        return locations;
    }
    /** Find hover from CSS document for providing class or id name hover for a HTML document. */
    findHover(matchDefPart, fromPart, fromDocument, maxStylePropertyCount) {
        let parts = [];
        for (let part of this.getPartsByType(matchDefPart.type)) {
            // Not match non-primary detailed.
            if (part.isSelectorDetailedType() && !part.primary) {
                continue;
            }
            if (!parts_1.PartComparer.isMayFormattedListMatch(part, matchDefPart)) {
                continue;
            }
            parts.push(part);
        }
        // Find independent part, if not found, get first.
        let part = parts.find(part => part.isSelectorDetailedType() && part.independent);
        if (!part && parts.length > 0) {
            part = parts[0];
        }
        if (!part) {
            return null;
        }
        if (part.isSelectorDetailedType()) {
            let wrapperPart = this.findPartAt(part.start);
            if (!wrapperPart) {
                return null;
            }
            return parts_1.PartConvertor.toHoverOfSelectorWrapper(wrapperPart, fromPart, this.document, fromDocument, maxStylePropertyCount);
        }
        else if (part.isCSSVariableDefinitionType()) {
            return parts_1.PartConvertor.toHoverOfCSSVariableDefinition(part, fromPart, fromDocument);
        }
        return null;
    }
    /** Find all css variable values. */
    getCSSVariables(names) {
        let map = new Map();
        for (let part of this.getPartsByType(parts_1.PartType.CSSVariableDefinition)) {
            if (!names.has(part.text)) {
                continue;
            }
            if (!part.value) {
                continue;
            }
            map.set(part.text, part.value);
        }
        return map;
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=base-service.js.map