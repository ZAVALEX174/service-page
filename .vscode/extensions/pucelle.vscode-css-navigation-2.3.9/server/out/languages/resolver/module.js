"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleResolver = void 0;
const utils_1 = require("../../utils");
const path_1 = require("./path");
/** Resolve module path or  */
var ModuleResolver;
(function (ModuleResolver) {
    /**
     * Scan imported CSS module.
     * By a `ReactImportedCSSModuleName` type of part.
     */
    async function resolveReactCSSModuleByName(moduleName, document) {
        let text = document.getText();
        let modulePath = resolveDefaultImportedPathByVariableName(moduleName, text);
        if (!modulePath) {
            return null;
        }
        let fullPath = await path_1.PathResolver.resolveDocumentPath(modulePath, document);
        return fullPath;
    }
    ModuleResolver.resolveReactCSSModuleByName = resolveReactCSSModuleByName;
    /** Try resolve `path` by matching `import name from path` after known `name`. */
    function resolveDefaultImportedPathByVariableName(variableName, text) {
        let re = /import\s+(?=\*\s+as\s+)?(\w+)\s+from\s+['"`](.+?)['"`]/g;
        let match;
        while (match = re.exec(text)) {
            let name = match[1];
            if (name === variableName) {
                return match[2];
            }
        }
        return null;
    }
    /**
     * Scan imported CSS module.
     * By a `ReactDefaultCSSModule` type of part.
     */
    async function resolveReactDefaultCSSModulePaths(document) {
        let text = document.getText();
        let paths = [];
        for (let modulePath of resolveNonNamedImportedPaths(text)) {
            let fullPath = await path_1.PathResolver.resolveDocumentPath(modulePath, document);
            if (fullPath) {
                paths.push(fullPath);
            }
        }
        return paths;
    }
    ModuleResolver.resolveReactDefaultCSSModulePaths = resolveReactDefaultCSSModulePaths;
    /** Resolve `import '....css'`. */
    function* resolveNonNamedImportedPaths(text) {
        let re = /import\s+['"`](.+?)['"`]/g;
        let match;
        while (match = re.exec(text)) {
            let path = match[1];
            if ((0, utils_1.isCSSLikePath)(path)) {
                yield path;
            }
        }
    }
})(ModuleResolver || (exports.ModuleResolver = ModuleResolver = {}));
//# sourceMappingURL=module.js.map