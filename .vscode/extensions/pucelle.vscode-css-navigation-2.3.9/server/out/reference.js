"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findReferences = findReferences;
const languages_1 = require("./languages");
const utils_1 = require("./utils");
/** Provide finding references service. */
async function findReferences(document, offset, htmlServiceMap, cssServiceMap, configuration) {
    let documentExtension = (0, utils_1.getPathExtension)(document.uri);
    let isHTMLFile = configuration.activeHTMLFileExtensions.includes(documentExtension);
    let isCSSFile = configuration.activeCSSFileExtensions.includes(documentExtension);
    let locations = null;
    if (isHTMLFile) {
        let currentHTMLService = await htmlServiceMap.forceGetServiceByDocument(document);
        if (!currentHTMLService) {
            return null;
        }
        let fromPart = currentHTMLService.findDetailedPartAt(offset);
        if (!fromPart) {
            return null;
        }
        // No reference.
        if (fromPart.type === languages_1.PartType.ClassPotential) {
            return null;
        }
        locations = await findReferencesInHTML(fromPart, currentHTMLService, htmlServiceMap, cssServiceMap);
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
        locations = await findReferencesInCSS(fromPart, currentCSSService, htmlServiceMap, cssServiceMap);
    }
    return locations;
}
/** In HTML files, or files that can include HTML codes. */
async function findReferencesInHTML(fromPart, _currentService, htmlServiceMap, cssServiceMap) {
    let matchPart = languages_1.PartConvertor.toDefinitionMode(fromPart);
    let locations = [];
    // Skip component tag.
    if (fromPart.type === languages_1.PartType.Tag && /^[A-Z]/.test(fromPart.text)) {
        return null;
    }
    // Find CSS Selector and CSS Variable across all HTML & CSS documents.
    if (fromPart.isDefinitionType() || fromPart.isReferenceType()) {
        locations.push(...await cssServiceMap.findReferences(matchPart, fromPart));
        locations.push(...await htmlServiceMap.findReferences(matchPart, fromPart));
    }
    return locations;
}
/** In CSS files, or a sass file. */
async function findReferencesInCSS(fromPart, _currentService, htmlServiceMap, cssServiceMap) {
    let matchPart = languages_1.PartConvertor.toDefinitionMode(fromPart);
    let locations = [];
    // Find CSS Selector and CSS Variable across all HTML & CSS documents.
    if (fromPart.isDefinitionType() || fromPart.isReferenceType()) {
        locations.push(...await cssServiceMap.findReferences(matchPart, fromPart));
        locations.push(...await htmlServiceMap.findReferences(matchPart, fromPart));
    }
    return locations;
}
//# sourceMappingURL=reference.js.map