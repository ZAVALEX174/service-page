"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompletionItems = getCompletionItems;
const languages_1 = require("./languages");
const utils_1 = require("./utils");
/** Provide auto completion service for HTML or CSS document. */
async function getCompletionItems(document, offset, htmlServiceMap, cssServiceMap, configuration) {
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
        return await getCompletionItemsInHTML(fromPart, currentHTMLService, document, cssServiceMap, offset);
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
        return await getCompletionItemsInCSS(fromPart, currentCSSService, document, htmlServiceMap, cssServiceMap, configuration);
    }
    return null;
}
/** Provide completion for HTML document. */
async function getCompletionItemsInHTML(fromPart, currentService, document, cssServiceMap, offset) {
    // `#i` -> `i` to do completion is not working.
    let matchPart = languages_1.PartConvertor.toDefinitionMode(fromPart);
    let labels = new languages_1.CompletionLabels();
    // Complete html element class name.
    if (fromPart.isHTMLType()) {
        labels.add(languages_1.CompletionLabelType.Definition, currentService.getCompletionLabels(matchPart, fromPart));
        labels.add(languages_1.CompletionLabelType.Definition, await cssServiceMap.getCompletionLabels(matchPart, fromPart));
    }
    // Complete class name for css selector of a css document.
    // It's a little different with css document, don't want it visits all html files.
    else if (fromPart.isCSSType()) {
        labels.add(languages_1.CompletionLabelType.CSSVariable, currentService.getReferencedCompletionLabels(fromPart));
        // Find all css variable declarations across all css documents.
        if (fromPart.isCSSVariableType()) {
            labels.add(languages_1.CompletionLabelType.CSSVariable, await cssServiceMap.getCompletionLabels(matchPart, fromPart));
        }
    }
    let forceEditCollapseToOffset = fromPart.type === languages_1.PartType.ClassPotential ? offset : undefined;
    return labels.output(fromPart, document, forceEditCollapseToOffset);
}
/** Provide completion for CSS document. */
async function getCompletionItemsInCSS(fromPart, currentService, document, htmlServiceMap, cssServiceMap, configuration) {
    let matchPart = languages_1.PartConvertor.toDefinitionMode(fromPart);
    let labels = new languages_1.CompletionLabels();
    // Find selector referenced completions from current document, and across all html documents.
    // It ignores css selectors declaration completions, which will be filled by vscode.
    if (fromPart.isSelectorType()) {
        labels.add(languages_1.CompletionLabelType.Reference, await htmlServiceMap.getReferencedCompletionLabels(fromPart));
    }
    // Find all css variable declarations across all css documents.
    else if (fromPart.isCSSVariableType()) {
        labels.add(languages_1.CompletionLabelType.CSSVariable, await cssServiceMap.getCompletionLabels(matchPart, fromPart));
        // Remove repetitive items with current document.
        if (configuration.disableOwnCSSVariableCompletion) {
            let currentLabels = currentService.getReferencedCompletionLabels(fromPart);
            labels.remove(currentLabels.keys());
        }
    }
    return labels.output(fromPart, document);
}
//# sourceMappingURL=completion.js.map