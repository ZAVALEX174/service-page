"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findHover = findHover;
const languages_1 = require("./languages");
const utils_1 = require("./utils");
/** Provide finding hover service. */
async function findHover(document, offset, htmlServiceMap, cssServiceMap, configuration) {
    let documentExtension = (0, utils_1.getPathExtension)(document.uri);
    let isHTMLFile = configuration.activeHTMLFileExtensions.includes(documentExtension);
    let isCSSFile = configuration.activeCSSFileExtensions.includes(documentExtension);
    if (isHTMLFile) {
        let currentHTMLService = await htmlServiceMap.forceGetServiceByDocument(document);
        if (!currentHTMLService) {
            return null;
        }
        let fromPart = currentHTMLService.findDetailedPartAt(offset);
        if (!fromPart) {
            return null;
        }
        // No hover.
        if (fromPart.type === languages_1.PartType.ClassPotential) {
            return null;
        }
        return await findHoverInAny(fromPart, currentHTMLService, document, cssServiceMap, configuration);
    }
    else if (isCSSFile) {
        let currentCSSService = await cssServiceMap.forceGetServiceByDocument(document);
        if (!currentCSSService) {
            return null;
        }
        let fromPart = currentCSSService.findDetailedPartAt(offset);
        if (!fromPart) {
            return null;
        }
        return await findHoverInAny(fromPart, currentCSSService, document, cssServiceMap, configuration);
    }
    return null;
}
/** Find hover in HTML or CSS files. */
async function findHoverInAny(fromPart, currentService, document, cssServiceMap, configuration) {
    if (!fromPart.isReferenceType()) {
        return null;
    }
    let matchPart = languages_1.PartConvertor.toDefinitionMode(fromPart);
    // Find within current document.
    let hover = currentService.findHover(matchPart, fromPart, document, configuration.maxHoverStylePropertyCount);
    if (hover) {
        return hover;
    }
    // Find across all css documents.
    if (fromPart.isSelectorType() || fromPart.isCSSVariableType()) {
        hover = await cssServiceMap.findHover(matchPart, fromPart, document, configuration.maxHoverStylePropertyCount);
    }
    if (hover) {
        return hover;
    }
    return null;
}
//# sourceMappingURL=hover.js.map