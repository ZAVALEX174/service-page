"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Part = exports.PartType = void 0;
const utils_1 = require("../trees/utils");
/** Part types. */
var PartType;
(function (PartType) {
    //// Common
    /**
     * `<link href=...>`
     * `<script src=...>`
     * `@import ...`
     * Import 'file.css'
     * Import name from 'file.css'
     * Contains only path.
     */
    PartType[PartType["CSSImportPath"] = 0] = "CSSImportPath";
    //// From HTML.
    PartType[PartType["Tag"] = 1] = "Tag";
    /** It doesn't include identifier `#`. */
    PartType[PartType["Id"] = 2] = "Id";
    /** It doesn't include identifier `.`. */
    PartType[PartType["Class"] = 3] = "Class";
    /** To do completion like `class="|"`. */
    PartType[PartType["ClassPotential"] = 4] = "ClassPotential";
    /**
     * `querySelector('div')`
     * `$('div')`
     */
    PartType[PartType["CSSSelectorQueryTag"] = 5] = "CSSSelectorQueryTag";
    /**
     * `querySelector('#id')`
     * `$('#id')`
     */
    PartType[PartType["CSSSelectorQueryId"] = 6] = "CSSSelectorQueryId";
    /**
     * `querySelector('.class-name')`
     * `$('.class-name')`
     */
    PartType[PartType["CSSSelectorQueryClass"] = 7] = "CSSSelectorQueryClass";
    /** `style.setProperty('--variable-name', ...)` */
    PartType[PartType["CSSVariableAssignment"] = 8] = "CSSVariableAssignment";
    /**
     * `import style from 'xxx.css'`
     * `class={style.className}`
     * `class={style['class-name']}`
    */
    PartType[PartType["ReactImportedCSSModuleName"] = 9] = "ReactImportedCSSModuleName";
    PartType[PartType["ReactImportedCSSModuleProperty"] = 10] = "ReactImportedCSSModuleProperty";
    /**
     * `import 'xxx.css'`
     * `styleName="class-name"`
    */
    PartType[PartType["ReactDefaultImportedCSSModuleClass"] = 11] = "ReactDefaultImportedCSSModuleClass";
    //// From CSS.
    /** Wrapper all other selector parts. */
    PartType[PartType["CSSSelectorWrapper"] = 12] = "CSSSelectorWrapper";
    /** div{...} */
    PartType[PartType["CSSSelectorTag"] = 13] = "CSSSelectorTag";
    /** It includes identifier `#`. */
    PartType[PartType["CSSSelectorId"] = 14] = "CSSSelectorId";
    /** It includes identifier `.`. */
    PartType[PartType["CSSSelectorClass"] = 15] = "CSSSelectorClass";
    /** `--variable-name: ...;` */
    PartType[PartType["CSSVariableDefinition"] = 16] = "CSSVariableDefinition";
    /** `property: var(--variable-name);` */
    PartType[PartType["CSSVariableReference"] = 17] = "CSSVariableReference";
    /** `property: --variable-name`, only for completion. */
    PartType[PartType["CSSVariableReferenceNoVar"] = 18] = "CSSVariableReferenceNoVar";
})(PartType || (exports.PartType = PartType = {}));
/**
 * Part is normally a tag, class, id attribute, or tag/class/id selector, or a css variable.
 * Trees will be destroyed, and parts will be cached, so ensure part cost few memories.
 */
class Part {
    /** Part type. */
    type;
    /**
     * Label, it may or may not include identifiers like `.`, `#` from raw text.
     * For `<div class="|name|">`, it doesn't include identifier
     * For `|.class|{}`, it includes identifier.
     */
    text;
    /** Start offset. */
    start;
    /** End of Definition. */
    defEnd;
    constructor(type, label, start, declarationEnd = -1) {
        this.type = type;
        this.text = label;
        this.start = start;
        this.defEnd = declarationEnd;
    }
    /** End offset. */
    get end() {
        return this.start + this.text.length;
    }
    /** HTML class and id attribute. */
    isHTMLType() {
        return this.type < PartType.CSSSelectorWrapper
            && this.type >= PartType.Tag;
    }
    /** CSS selector and variables. */
    isCSSType() {
        return this.type >= PartType.CSSSelectorWrapper;
    }
    isCSSVariableType() {
        return this.type === PartType.CSSVariableAssignment
            || this.type === PartType.CSSVariableDefinition
            || this.type === PartType.CSSVariableReference
            || this.type === PartType.CSSVariableReferenceNoVar;
    }
    isCSSVariableDefinitionType() {
        return this.type === PartType.CSSVariableDefinition;
    }
    isDefinitionType() {
        return this.type === PartType.CSSSelectorTag
            || this.type === PartType.CSSSelectorId
            || this.type === PartType.CSSSelectorClass
            || this.type === PartType.CSSVariableDefinition;
    }
    isReferenceType() {
        return this.type === PartType.Tag
            || this.type === PartType.Id
            || this.type === PartType.Class
            || this.type === PartType.CSSSelectorQueryTag
            || this.type === PartType.CSSSelectorQueryId
            || this.type === PartType.CSSSelectorQueryClass
            || this.type === PartType.CSSVariableAssignment
            || this.type === PartType.CSSVariableReference
            || this.type === PartType.ReactDefaultImportedCSSModuleClass
            || this.type === PartType.ReactImportedCSSModuleProperty;
    }
    isSelectorWrapperType() {
        return this.type === PartType.CSSSelectorWrapper;
    }
    isSelectorType() {
        return this.type === PartType.Tag
            || this.type === PartType.Id
            || this.type === PartType.Class
            || this.type === PartType.CSSSelectorQueryTag
            || this.type === PartType.CSSSelectorQueryId
            || this.type === PartType.CSSSelectorQueryClass
            || this.type === PartType.CSSSelectorWrapper
            || this.type === PartType.CSSSelectorTag
            || this.type === PartType.CSSSelectorId
            || this.type === PartType.CSSSelectorClass
            || this.type === PartType.ReactDefaultImportedCSSModuleClass
            || this.type === PartType.ReactImportedCSSModuleProperty;
    }
    isSelectorDetailedType() {
        return this.type === PartType.CSSSelectorTag
            || this.type === PartType.CSSSelectorId
            || this.type === PartType.CSSSelectorClass;
    }
    /** Only definition part has formatted list. */
    hasFormattedList() {
        return this.type === PartType.CSSSelectorWrapper
            || this.type === PartType.CSSSelectorTag
            || this.type === PartType.CSSSelectorId
            || this.type === PartType.CSSSelectorClass;
    }
    /** `"ab"` => `ab`. */
    removeQuotes() {
        let text = this.text;
        let start = this.start;
        if ((0, utils_1.hasQuotes)(text)) {
            text = text.slice(1, -1);
            start++;
            return new Part(this.type, text, start, this.defEnd);
        }
        else {
            return this;
        }
    }
    /** Trim text. */
    trim() {
        let text = this.text;
        let start = this.start;
        if (/^\s+/.test(text)) {
            text = text.trimLeft();
            start += this.text.length - text.length;
            return new Part(this.type, text, start, this.defEnd);
        }
        if (/\s+$/.test(text)) {
            text = text.trimRight();
        }
        if (text !== this.text) {
            return new Part(this.type, text, start, this.defEnd);
        }
        else {
            return this;
        }
    }
}
exports.Part = Part;
//# sourceMappingURL=part.js.map