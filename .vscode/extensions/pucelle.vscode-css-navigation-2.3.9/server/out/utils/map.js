"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoWayListMap = exports.ListMap = void 0;
/**
 * `K => V[]` Map Struct.
 * Good for purely adding.
 */
class ListMap {
    map = new Map();
    /** Iterate all keys. */
    keys() {
        return this.map.keys();
    }
    /** Iterate all values in list type. */
    valueLists() {
        return this.map.values();
    }
    /** Iterate all values. */
    *values() {
        for (let list of this.map.values()) {
            yield* list;
        }
    }
    /** Iterate each key and associated value list. */
    entries() {
        return this.map.entries();
    }
    /** Iterate each key and each associated value after flatted. */
    *flatEntries() {
        for (let [key, values] of this.map.entries()) {
            for (let value of values) {
                yield [key, value];
            }
        }
    }
    /** Has specified key and value pair existed. */
    has(k, v) {
        return !!this.map.get(k)?.includes(v);
    }
    /** Has specified key existed. */
    hasKey(k) {
        return this.map.has(k);
    }
    /** Get the count of values by associated key. */
    countOf(k) {
        return this.map.get(k)?.length || 0;
    }
    /** Get the count of all the values. */
    valueCount() {
        let count = 0;
        for (let values of this.map.values()) {
            count += values.length;
        }
        return count;
    }
    /** Get the count of all the keys. */
    keyCount() {
        return this.map.size;
    }
    /**
     * Add a key and a value.
     * Note it will not validate whether value exist,
     * and will add value repeatedly although it exists.
     */
    add(k, v) {
        let values = this.map.get(k);
        if (!values) {
            values = [v];
            this.map.set(k, values);
        }
        else {
            values.push(v);
        }
    }
    /**
     * Add a key and several values.
     * Note it will not validate whether value exist,
     * and will add value repeatedly although it exists.
     */
    addSeveral(k, vs) {
        if (vs.length === 0) {
            return;
        }
        let values = this.map.get(k);
        if (!values) {
            values = [...vs];
            this.map.set(k, values);
        }
        else {
            values.push(...vs);
        }
    }
    /**
     * Add a key and a value.
     * Note it will validate whether value exist, and ignore if value exists.
     */
    addIf(k, v) {
        let values = this.map.get(k);
        if (!values) {
            values = [v];
            this.map.set(k, values);
        }
        else if (!values.includes(v)) {
            values.push(v);
        }
    }
    /**
     * Add a key and a value.
     * Note it will validate whether value exist, and ignore if value exists.
     */
    addSeveralIf(k, vs) {
        if (vs.length === 0) {
            return;
        }
        let values = this.map.get(k);
        if (!values) {
            values = [];
            this.map.set(k, values);
        }
        for (let v of vs) {
            if (!values.includes(v)) {
                values.push(v);
            }
        }
    }
    /** Get value list by associated key. */
    get(k) {
        return this.map.get(k);
    }
    /** Set and replace whole value list by associated key. */
    set(k, list) {
        return this.map.set(k, list);
    }
    /** Delete a key value pair. */
    delete(k, v) {
        let values = this.map.get(k);
        if (values) {
            let index = values.indexOf(v);
            if (index > -1) {
                values.splice(index, 1);
                if (values.length === 0) {
                    this.map.delete(k);
                }
            }
        }
    }
    /** Delete a key and several values. */
    deleteSeveral(k, vs) {
        let values = this.map.get(k);
        if (values) {
            for (let v of vs) {
                let index = values.indexOf(v);
                if (index > -1) {
                    values.splice(index, 1);
                }
            }
            if (values.length === 0) {
                this.map.delete(k);
            }
        }
    }
    /** Delete all values by associated key. */
    deleteOf(k) {
        this.map.delete(k);
    }
    /** Clear all the data. */
    clear() {
        this.map = new Map();
    }
}
exports.ListMap = ListMap;
/**
 * Map Struct that can query from left to right list and right to left list.
 * `L -> R[]`
 * `R -> L[]`
 */
class TwoWayListMap {
    lm = new ListMap();
    rm = new ListMap();
    /** Returns total count of left keys. */
    leftKeyCount() {
        return this.lm.keyCount();
    }
    /** Returns total count of right keys. */
    rightKeyCount() {
        return this.rm.keyCount();
    }
    /** Iterate all left keys. */
    leftKeys() {
        return this.lm.keys();
    }
    /** Iterate all right keys. */
    rightKeys() {
        return this.rm.keys();
    }
    /** Iterate associated right keys by left key. */
    *rightValuesOf(l) {
        let rs = this.lm.get(l);
        if (rs) {
            yield* rs;
        }
    }
    /** Iterate associated left keys by right key. */
    *leftValuesOf(r) {
        let ls = this.rm.get(r);
        if (ls) {
            yield* ls;
        }
    }
    /** Iterate left and it's associated right value list. */
    leftEntries() {
        return this.lm.entries();
    }
    /** Iterate right and it's associated left value list. */
    rightEntries() {
        return this.rm.entries();
    }
    /** Iterate each left and right key pairs. */
    flatEntries() {
        return this.lm.flatEntries();
    }
    /** Has a left and right key pair. */
    has(l, r) {
        return this.lm.has(l, r);
    }
    /** Has a left key. */
    hasLeft(l) {
        return this.lm.hasKey(l);
    }
    /** Has a right key. */
    hasRight(r) {
        return this.rm.hasKey(r);
    }
    /** Get count of associated right keys by a left key. */
    countOfLeft(l) {
        return this.lm.countOf(l);
    }
    /** Get count of associated left keys by a right key. */
    countOfRight(r) {
        return this.rm.countOf(r);
    }
    /** Get associated right keys by a left key. */
    getByLeft(l) {
        return this.lm.get(l);
    }
    /** Get associated left keys by a right key. */
    getByRight(r) {
        return this.rm.get(r);
    }
    /**
     * Add a left and right value as a pair.
     * Note it will not validate whether value exist, and will add it repeatedly if it exists.
     */
    add(l, r) {
        this.lm.add(l, r);
        this.rm.add(r, l);
    }
    /**
     * Add a left and right value as a pair.
     * Note it will validate whether value exist, and do nothing if it exists.
     */
    addIf(l, r) {
        this.lm.addIf(l, r);
        this.rm.addIf(r, l);
    }
    /** Delete a left and right key pair. */
    delete(l, r) {
        this.lm.delete(l, r);
        this.rm.delete(r, l);
    }
    /** Delete by left key. */
    deleteLeft(l) {
        let rs = this.getByLeft(l);
        if (rs) {
            for (let r of rs) {
                this.rm.delete(r, l);
            }
            this.lm.deleteOf(l);
        }
    }
    /** Delete by right key. */
    deleteRight(r) {
        let ls = this.getByRight(r);
        if (ls) {
            for (let l of ls) {
                this.lm.delete(l, r);
            }
            this.rm.deleteOf(r);
        }
    }
    /** Replace left and all it's associated right keys. */
    replaceLeft(l, rs) {
        let oldRs = this.lm.get(l);
        if (oldRs) {
            for (let r of rs) {
                if (!oldRs.includes(r)) {
                    this.rm.add(r, l);
                }
            }
            for (let r of oldRs) {
                if (!rs.includes(r)) {
                    this.rm.delete(r, l);
                }
            }
        }
        else {
            for (let r of rs) {
                this.rm.add(r, l);
            }
        }
        this.lm.set(l, rs);
    }
    /** Replace right and all it's associated left keys. */
    replaceRight(r, ls) {
        let oldLs = this.rm.get(r);
        if (oldLs) {
            for (let l of ls) {
                if (!oldLs.includes(l)) {
                    this.lm.add(l, r);
                }
            }
            for (let l of oldLs) {
                if (!ls.includes(l)) {
                    this.lm.delete(l, r);
                }
            }
        }
        else {
            for (let l of ls) {
                this.lm.add(l, r);
            }
        }
        this.rm.set(r, ls);
    }
    /** Clear all the data. */
    clear() {
        this.lm.clear();
        this.rm.clear();
    }
}
exports.TwoWayListMap = TwoWayListMap;
//# sourceMappingURL=map.js.map