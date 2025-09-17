"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageIds = void 0;
var LanguageIds;
(function (LanguageIds) {
    function isHTMLSyntax(languageId) {
        return languageId === 'html'
            || languageId === 'jsx'
            || languageId === 'tsx'
            || languageId === 'js'
            || languageId === 'ts';
    }
    LanguageIds.isHTMLSyntax = isHTMLSyntax;
    function isCSSSyntax(languageId) {
        return languageId === 'css'
            || languageId === 'sass'
            || languageId === 'scss'
            || languageId === 'less';
    }
    LanguageIds.isCSSSyntax = isCSSSyntax;
    function isScssLessSyntax(languageId) {
        return languageId === 'sass'
            || languageId === 'scss'
            || languageId === 'less';
    }
    LanguageIds.isScssLessSyntax = isScssLessSyntax;
    function isScriptSyntax(languageId) {
        return isHTMLSyntax(languageId) && languageId !== 'html';
    }
    LanguageIds.isScriptSyntax = isScriptSyntax;
    function isReactScriptSyntax(languageId) {
        return languageId === 'jsx' || languageId === 'tsx';
    }
    LanguageIds.isReactScriptSyntax = isReactScriptSyntax;
})(LanguageIds || (exports.LanguageIds = LanguageIds = {}));
//# sourceMappingURL=language-ids.js.map