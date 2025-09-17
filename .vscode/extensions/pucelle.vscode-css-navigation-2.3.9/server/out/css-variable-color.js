"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCSSVariableColors = getCSSVariableColors;
const languages_1 = require("./languages");
const utils_1 = require("./utils");
/** Provide finding hover service. */
async function getCSSVariableColors(document, htmlServiceMap, cssServiceMap, configuration) {
    let documentExtension = (0, utils_1.getPathExtension)(document.uri);
    let isHTMLFile = configuration.activeHTMLFileExtensions.includes(documentExtension);
    let isCSSFile = configuration.activeCSSFileExtensions.includes(documentExtension);
    if (isHTMLFile) {
        let currentHTMLService = await htmlServiceMap.forceGetServiceByDocument(document);
        if (!currentHTMLService) {
            return null;
        }
        return getCSSVariableColorsInAny(currentHTMLService, cssServiceMap, document);
    }
    else if (isCSSFile) {
        let currentCSSService = await cssServiceMap.forceGetServiceByDocument(document);
        if (!currentCSSService) {
            return null;
        }
        return await getCSSVariableColorsInAny(currentCSSService, cssServiceMap, document);
    }
    return null;
}
/** For HTML or CSS file. */
async function getCSSVariableColorsInAny(currentService, cssServiceMap, document) {
    let parts = currentService.getPartsByType(languages_1.PartType.CSSVariableReference);
    let variableNames = new Set(parts.map(part => part.text));
    if (variableNames.size === 0) {
        return [];
    }
    let currentVariableMap = currentService.getCSSVariables(variableNames);
    // Stop searching if find all within current document.
    if (currentVariableMap.size === variableNames.size) {
        return makeColorInformation(parts, currentVariableMap, document);
    }
    let variableMap = await cssServiceMap.getCSSVariables(variableNames);
    return makeColorInformation(parts, variableMap, document);
}
function makeColorInformation(parts, variableMap, document) {
    let items = [];
    for (let part of parts) {
        let value = variableMap.get(part.text);
        if (!value) {
            continue;
        }
        let info = languages_1.PartConvertor.toColorInformation(part, value, document);
        if (info) {
            items.push(info);
        }
    }
    return items;
}
//# sourceMappingURL=css-variable-color.js.map