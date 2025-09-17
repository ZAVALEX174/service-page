"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathResolver = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const path = require("path");
const fs = require("fs-extra");
const utils_1 = require("../../utils");
const parts_1 = require("../parts");
var PathResolver;
(function (PathResolver) {
    /** Resolve import fs path, will search `node_modules` directory to find final import path. */
    async function resolveRelativePath(fromPath, toPath) {
        let isModulePath = toPath.startsWith('~');
        let fromDir = path.dirname(fromPath);
        let beModuleImport = false;
        // `~modulename/...`
        if (isModulePath) {
            toPath = toPath.slice(1);
            toPath = fixPathExtension(toPath, fromPath);
            toPath = 'node_modules/' + toPath;
            beModuleImport = true;
        }
        else {
            toPath = fixPathExtension(toPath, fromPath);
            // Import relative path.
            let filePath = path.resolve(fromDir, toPath);
            if (await fs.pathExists(filePath) && (await fs.stat(filePath)).isFile()) {
                return filePath;
            }
            // .xxx or ../xxx is not module import.
            if (!/^\./.test(toPath)) {
                toPath = 'node_modules/' + toPath;
                beModuleImport = true;
            }
        }
        if (beModuleImport) {
            while (fromDir) {
                let filePath = path.resolve(fromDir, toPath);
                if (await fs.pathExists(filePath) && (await fs.stat(filePath)).isFile()) {
                    return filePath;
                }
                let dir = path.dirname(fromDir);
                if (dir === fromDir) {
                    break;
                }
                fromDir = dir;
            }
        }
        return null;
    }
    PathResolver.resolveRelativePath = resolveRelativePath;
    /** Fix imported path with extension. */
    function fixPathExtension(toPath, fromPath) {
        let fromPathExtension = (0, utils_1.getPathExtension)(fromPath);
        if (fromPathExtension === 'scss') {
            // @import `b` -> `b.scss`
            if (path.extname(toPath) === '') {
                toPath += '.scss';
            }
        }
        // One issue here:
        //   If we rename `b.scss` to `_b.scss` in `node_modules`,
        //   we can't get file changing notification from VSCode,
        //   and we can't reload it from path because nothing changes in it.
        // So we may need to validate if imported paths exist after we got definition results,
        // although we still can't get new contents in `_b.scss`.
        return toPath;
    }
    /**
     * Make a link which lick to current import location.
     * `part` must be in `Import` type.
     */
    async function resolveImportLocationLink(part, document) {
        let importPath = await resolveDocumentPath(part.text, document);
        if (!importPath) {
            return null;
        }
        let uri = vscode_uri_1.URI.file(importPath).toString();
        let targetRange = vscode_languageserver_1.Range.create(0, 0, 0, 0);
        let selectionRange = targetRange;
        let fromRange = parts_1.PartConvertor.toRange(part, document);
        return vscode_languageserver_1.LocationLink.create(uri, targetRange, selectionRange, fromRange);
    }
    PathResolver.resolveImportLocationLink = resolveImportLocationLink;
    /** Resolve import path to full path. */
    async function resolveDocumentPath(importPath, document) {
        let currentPath = vscode_uri_1.URI.parse(document.uri).fsPath;
        let fullPath = await resolveRelativePath(currentPath, importPath);
        return fullPath;
    }
    PathResolver.resolveDocumentPath = resolveDocumentPath;
})(PathResolver || (exports.PathResolver = PathResolver = {}));
//# sourceMappingURL=path.js.map