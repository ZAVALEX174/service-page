"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSService = void 0;
const trees_1 = require("../trees");
const base_service_1 = require("./base-service");
/** Gives CSS service for one CSS file. */
class CSSService extends base_service_1.BaseService {
    makeTree() {
        return trees_1.CSSTokenTree.fromString(this.document.getText(), 0, this.document.languageId);
    }
}
exports.CSSService = CSSService;
//# sourceMappingURL=css-service.js.map