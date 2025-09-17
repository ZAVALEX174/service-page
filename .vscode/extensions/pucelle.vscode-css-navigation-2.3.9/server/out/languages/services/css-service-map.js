"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSServiceMap = void 0;
const css_service_1 = require("./css-service");
const base_service_map_1 = require("./base-service-map");
const vscode_uri_1 = require("vscode-uri");
/** Gives CSS service for multiple files. */
class CSSServiceMap extends base_service_map_1.BaseServiceMap {
    createService(document) {
        return new css_service_1.CSSService(document);
    }
    /** Parse document to CSS service, and analyze imported. */
    async parseDocument(uri, document) {
        super.parseDocument(uri, document);
        let cssService = this.serviceMap.get(uri);
        if (!cssService) {
            return;
        }
        // If having `@import ...`, load it.
        let importPaths = await cssService.getImportedCSSPaths();
        let importedURIs = importPaths.map(path => vscode_uri_1.URI.file(path).toString());
        for (let importPath of importPaths) {
            this.trackMoreFile(importPath);
        }
        this.trackingMap.addImported(importedURIs, uri);
    }
}
exports.CSSServiceMap = CSSServiceMap;
//# sourceMappingURL=css-service-map.js.map