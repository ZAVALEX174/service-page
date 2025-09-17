"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Picker = void 0;
var Picker;
(function (Picker) {
    /** "ab cd" => ["ab", "cd"]. */
    function pickWords(text) {
        let re = /[\w-]+/g;
        let match;
        let words = [];
        while (match = re.exec(text)) {
            let start = match.index;
            words.push({
                text: match[0],
                start,
            });
        }
        return words;
    }
    Picker.pickWords = pickWords;
    /** ["ab", {cd: ef}] => ["ab", "cd"]. */
    function pickWordsFromExpression(text) {
        let re = /"(?:\\"|.)*?"|'(?:\\'|.)*?'|`(?:\\`|.)*?`|(\w+)\s*:/g;
        let match;
        let words = [];
        while (match = re.exec(text)) {
            let start = match.index;
            if (match[1]) {
                words.push({
                    text: match[1],
                    start,
                });
            }
            else {
                for (let item of pickWords(match[0])) {
                    words.push({
                        start: start + item.start,
                        text: item.text,
                    });
                }
            }
        }
        return words;
    }
    Picker.pickWordsFromExpression = pickWordsFromExpression;
    /**
     * `"|"` -> `[""]`.
     * `"a |"` -> `[""]`.
     * `"a | b"` -> `[""]`.
     */
    function pickPotentialEmptyWords(text) {
        let re = /"(?:\\"|.)*?"|'(?:\\'|.)*?'|`(?:\\`|.)*?`/g;
        let match;
        let words = [];
        while (match = re.exec(text)) {
            let start = match.index + 1;
            let quoted = match[0].slice(1, -1);
            // `"|"` -> `[""]`.
            if (quoted.length === 0) {
                words.push({
                    text: '',
                    start,
                });
            }
            else {
                let sm;
                let re = /\s+/g;
                while (sm = re.exec(quoted)) {
                    let subStart = sm.index;
                    let subEnd = sm.index + sm[0].length;
                    // `| a`
                    if (subStart === 0) {
                        subEnd--;
                    }
                    // `a |`
                    else if (subEnd === quoted.length) {
                        subStart++;
                    }
                    // `a  b`
                    else {
                        subStart++;
                        subEnd--;
                    }
                    // `a b`
                    if (subStart > subEnd) {
                        continue;
                    }
                    words.push({
                        text: quoted.slice(subStart, subEnd),
                        start: start + subStart,
                    });
                }
            }
        }
        return words;
    }
    Picker.pickPotentialEmptyWords = pickPotentialEmptyWords;
    /**
     * Add start offset to each match item.
     * Note it may not 100% get correct result.
     * `re` must not be global.
     */
    function addOffsetToMatch(match) {
        let o = [];
        let lastIndex = 0;
        for (let i = 0; i < match.length; i++) {
            let m = match[i];
            if (!m) {
                continue;
            }
            let start = i === 0 ? 0 : match[0].indexOf(m, lastIndex);
            o.push({
                text: m,
                start: match.index + start,
            });
            if (i > 0) {
                lastIndex = start + m.length;
            }
        }
        return o;
    }
    /**
     * Add start offset to each grouped match item.
     * Note it may not 100% get correct result.
     * `re` must not be global.
     */
    function addOffsetToMatchGroup(match) {
        let o = {};
        let groups = match.groups;
        if (!groups) {
            return o;
        }
        let lastIndex = 0;
        for (let [k, m] of Object.entries(groups)) {
            if (!m) {
                continue;
            }
            let start = match[0].indexOf(m, lastIndex);
            o[k] = {
                text: m,
                start: match.index + start,
            };
            lastIndex = start + m.length;
        }
        return o;
    }
    /**
     * Match string, add start offset to each match.
     * Note it may not 100% get correct result.
     * Note it will skip not captured matches, means `/(1)|(2)/` will always fill match[1].
     * `re` must not be global.
     */
    function locateMatches(text, re) {
        let match = text.match(re);
        if (!match) {
            return null;
        }
        return addOffsetToMatch(match);
    }
    Picker.locateMatches = locateMatches;
    /**
     * Match string to get match groups, add start offset to each grouped match.
     * Note it may not 100% get correct result.
     * `re` must not be global.
     */
    function locateMatchGroups(text, re) {
        let match = text.match(re);
        if (!match) {
            return null;
        }
        return addOffsetToMatchGroup(match);
    }
    Picker.locateMatchGroups = locateMatchGroups;
    /**
     * Match string, add start offset to each match.
     * Note it may not 100% get correct result.
     * Note it will skip not captured matches, means `/(1)|(2)/` will always fill match[1].
     * Beware, captured group must capture at least one character.
     * `re` must be global.
     */
    function* locateAllMatches(text, re) {
        let match;
        while (match = re.exec(text)) {
            yield addOffsetToMatch(match);
        }
    }
    Picker.locateAllMatches = locateAllMatches;
    /**
     * Match string to get match groups, add start offset to each grouped match.
     * Note it may not 100% get correct result.
     * `re` must be global.
     */
    function* locateAllMatchGroups(text, re) {
        let match;
        while (match = re.exec(text)) {
            yield addOffsetToMatchGroup(match);
        }
    }
    Picker.locateAllMatchGroups = locateAllMatchGroups;
})(Picker || (exports.Picker = Picker = {}));
//# sourceMappingURL=picker.js.map