"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSTokenNode = exports.CSSTokenNodeType = void 0;
const any_node_1 = require("./any-node");
/** CSS token type. */
var CSSTokenNodeType;
(function (CSSTokenNodeType) {
    CSSTokenNodeType[CSSTokenNodeType["Root"] = 0] = "Root";
    CSSTokenNodeType[CSSTokenNodeType["Command"] = 1] = "Command";
    CSSTokenNodeType[CSSTokenNodeType["Selector"] = 2] = "Selector";
    /** Like `from`, `to` of `@keyframes{from{}, to{}}`. */
    CSSTokenNodeType[CSSTokenNodeType["ClosureName"] = 3] = "ClosureName";
    CSSTokenNodeType[CSSTokenNodeType["PropertyName"] = 4] = "PropertyName";
    CSSTokenNodeType[CSSTokenNodeType["PropertyValue"] = 5] = "PropertyValue";
})(CSSTokenNodeType || (exports.CSSTokenNodeType = CSSTokenNodeType = {}));
/** Build a simple tree by tokens. */
class CSSTokenNode extends any_node_1.AnyTokenNode {
    type;
    /** Comment Token. */
    commentToken;
    constructor(type, token, parent, commentToken = null) {
        super(token, parent);
        this.type = type;
        this.commentToken = commentToken;
        if (type === CSSTokenNodeType.Command
            || type === CSSTokenNodeType.Selector
            || type === CSSTokenNodeType.ClosureName
            || type === CSSTokenNodeType.Root) {
            this.children = [];
        }
    }
    isRoot() {
        return this.type === CSSTokenNodeType.Root;
    }
    /** Definition end, or end. */
    get defLikeEnd() {
        return this.defEnd > -1 ? this.defEnd : this.token.end;
    }
}
exports.CSSTokenNode = CSSTokenNode;
//# sourceMappingURL=css-node.js.map