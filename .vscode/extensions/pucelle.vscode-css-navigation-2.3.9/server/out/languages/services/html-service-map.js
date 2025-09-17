"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLServiceMap = void 0;
const html_service_1 = require("./html-service");
const base_service_map_1 = require("./base-service-map");
class HTMLServiceMap extends base_service_map_1.BaseServiceMap {
    createService(document) {
        return new html_service_1.HTMLService(document);
    }
}
exports.HTMLServiceMap = HTMLServiceMap;
//# sourceMappingURL=html-service-map.js.map