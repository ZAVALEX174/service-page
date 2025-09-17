"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnyTokenNode = void 0;
/** Build a simple tree by tokens. */
class AnyTokenNode {
    token;
    parent;
    children = null;
    /** Definition end. */
    defEnd = -1;
    constructor(token, parent) {
        this.token = token;
        this.parent = parent;
    }
    /** Whether be root node. */
    isRoot() {
        return this.token.start === -1;
    }
    /** Get next sibling. */
    getNextSibling() {
        if (!this.parent) {
            return null;
        }
        let index = this.parent.children.indexOf(this);
        if (index < this.parent.children.length - 1) {
            return this.parent.children[index + 1];
        }
        return null;
    }
    /** Sort walking of parts. */
    *sortParts(walk) {
        let list = [...walk];
        list.sort((a, b) => a.start - b.start);
        yield* list;
    }
    /** Walk all nodes, exclude root node. */
    *walk() {
        if (!this.isRoot()) {
            yield this;
        }
        if (this.children) {
            for (let child of this.children) {
                yield* child.walk();
            }
        }
    }
    /** If not match filter, will skip itself and all descendants. */
    *filterWalk(filter) {
        // Must be root, or match filter.
        if (!(this.isRoot || filter(this))) {
            return;
        }
        if (!this.isRoot) {
            yield this;
        }
        if (this.children) {
            for (let child of this.children) {
                yield* child.walk();
            }
        }
    }
}
exports.AnyTokenNode = AnyTokenNode;
//# sourceMappingURL=any-node.js.map