"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLTokenNode = void 0;
const scanners_1 = require("../scanners");
const utils_1 = require("./utils");
const any_node_1 = require("./any-node");
/** Build a simple tree by tokens. */
class HTMLTokenNode extends any_node_1.AnyTokenNode {
    /** `<a>|`, for only tag node. */
    tagEnd = -1;
    attrs = null;
    constructor(token, parent) {
        super(token, parent);
        if (token.type === scanners_1.HTMLTokenType.StartTagName) {
            this.attrs = [];
            this.children = [];
        }
    }
    get tagName() {
        return this.token.type === scanners_1.HTMLTokenType.StartTagName ? this.token.text : null;
    }
    get firstTextNode() {
        if (this.children && this.children.length > 0 && this.children[0].token.type === scanners_1.HTMLTokenType.Text) {
            return this.children[0];
        }
        return null;
    }
    /**
     * Get tag end, normally after last attribute.
     * If not tag, returns token end.
     */
    get tagLikeEnd() {
        return this.tagEnd > -1 ? this.tagEnd : this.token.end;
    }
    /**
     * Get definition end, `<div>...</div>|`.
     * If not tag, returns token end.
     */
    get defLikeEnd() {
        return this.defEnd > -1 ? this.defEnd : this.token.end;
    }
    /** Attribute value text, with quotes removed. */
    getAttributeValue(name) {
        if (!this.attrs) {
            return null;
        }
        let attr = this.attrs.find(attr => attr.name.text === name);
        if (attr && attr.value) {
            return (0, utils_1.removeQuotes)(attr.value.text);
        }
        return null;
    }
    getAttribute(name) {
        if (!this.attrs) {
            return null;
        }
        let attr = this.attrs.find(attr => attr.name.text === name);
        if (attr) {
            return attr.value;
        }
        return null;
    }
}
exports.HTMLTokenNode = HTMLTokenNode;
//# sourceMappingURL=html-node.js.map