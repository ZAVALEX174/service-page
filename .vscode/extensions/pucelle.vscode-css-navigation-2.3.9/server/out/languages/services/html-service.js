"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLService = void 0;
const trees_1 = require("../trees");
const base_service_1 = require("./base-service");
const HTMLLanguageIdMap = {
    // If document opened.
    'javascriptreact': 'jsx',
    'typescriptreact': 'tsx',
    'javascript': 'js',
    'typescript': 'ts',
    // If document closed.
    'jsx': 'jsx',
    'js': 'js',
    'tsx': 'tsx',
    'ts': 'ts',
};
/** Scan html code pieces in files that can include HTML codes, like html, js, jsx, ts, tsx. */
class HTMLService extends base_service_1.BaseService {
    makeTree() {
        let languageId = HTMLLanguageIdMap[this.document.languageId] ?? 'html';
        if (languageId === 'html') {
            return trees_1.HTMLTokenTree.fromString(this.document.getText(), 0, languageId);
        }
        else {
            return trees_1.JSTokenTree.fromString(this.document.getText(), 0, languageId);
        }
    }
}
exports.HTMLService = HTMLService;
//# sourceMappingURL=html-service.js.map