"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingTest = void 0;
const minimatch = require("minimatch");
const vscode_uri_1 = require("vscode-uri");
class TrackingTest {
    includeFileMatcher;
    excludeMatcher;
    alwaysIncludeMatcher;
    constructor(options) {
        let alwaysIncludeGlobPattern = options.alwaysIncludeGlobPattern || null;
        this.includeFileMatcher = new minimatch.Minimatch(options.includeFileGlobPattern);
        this.excludeMatcher = options.excludeGlobPattern ? new minimatch.Minimatch(options.excludeGlobPattern) : null;
        this.alwaysIncludeMatcher = alwaysIncludeGlobPattern ? new minimatch.Minimatch(alwaysIncludeGlobPattern) : null;
    }
    /** Returns whether should include file, ignore exclude test. */
    shouldIncludeFile(filePath) {
        return this.includeFileMatcher.match(filePath);
    }
    /** Returns whether should track uri. */
    shouldTrackURI(uri) {
        let fsPath = vscode_uri_1.URI.parse(uri).fsPath;
        if (!this.includeFileMatcher.match(fsPath)) {
            return false;
        }
        if (this.shouldExcludeFileOrFolder(fsPath)) {
            return false;
        }
        return true;
    }
    /** Returns whether should track file. */
    shouldTrackFile(filePath) {
        if (!this.includeFileMatcher.match(filePath)) {
            return false;
        }
        if (this.shouldExcludeFileOrFolder(filePath)) {
            return false;
        }
        return true;
    }
    /** Returns whether should exclude file or folder. */
    shouldExcludeFileOrFolder(fsPath) {
        // Not always include.
        if (this.alwaysIncludeMatcher && this.alwaysIncludeMatcher.match(fsPath)) {
            return false;
        }
        // Be exclude.
        if (this.excludeMatcher && this.excludeMatcher.match(fsPath)) {
            return true;
        }
        return false;
    }
}
exports.TrackingTest = TrackingTest;
//# sourceMappingURL=tracking-test.js.map