"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLongestCommonSubsequenceLength = getLongestCommonSubsequenceLength;
exports.generateGlobPatternByPatterns = generateGlobPatternByPatterns;
exports.generateGlobPatternByExtensions = generateGlobPatternByExtensions;
exports.getPathExtension = getPathExtension;
exports.replacePathExtension = replacePathExtension;
exports.isCSSLikePath = isCSSLikePath;
const path = require("path");
/** Get longest common subsequence length of two paths. */
function getLongestCommonSubsequenceLength(a, b) {
    let m = a.length;
    let n = b.length;
    let len = Math.min(m, n);
    for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) {
            return i;
        }
    }
    return len;
}
function generateGlobPatternByPatterns(patterns) {
    if (patterns.length > 1) {
        return '{' + patterns.join(',') + '}';
    }
    else if (patterns.length === 1) {
        return patterns[0];
    }
    return null;
}
function generateGlobPatternByExtensions(extensions) {
    if (extensions.length > 1) {
        return '**/*.{' + extensions.join(',') + '}';
    }
    else if (extensions.length === 1) {
        return '**/*.' + extensions[0];
    }
    return null;
}
function getPathExtension(filePath) {
    return path.extname(filePath).slice(1).toLowerCase();
}
function replacePathExtension(filePath, toExtension) {
    return filePath.replace(/\.\w+$/, '.' + toExtension);
}
function isCSSLikePath(filePath) {
    return ['css', 'less', 'scss', 'sass'].includes(getPathExtension(filePath));
}
//# sourceMappingURL=path.js.map