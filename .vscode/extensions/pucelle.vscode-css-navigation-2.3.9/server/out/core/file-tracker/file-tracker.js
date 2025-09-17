"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTracker = void 0;
const path = require("path");
const fs = require("fs-extra");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const logger_1 = require("../logger");
const vscode_uri_1 = require("vscode-uri");
const file_walker_1 = require("./file-walker");
const glob_1 = require("glob");
const util_1 = require("util");
const tracking_map_1 = require("./tracking-map");
const tracking_test_1 = require("./tracking-test");
/** Clean long-unused imported only sources every 5mins. */
const CheckUnUsedTimeInterval = 5 * 60 * 1000;
/** Class to track one type of files in a directory. */
class FileTracker {
    documents;
    window;
    startPath;
    alwaysIncludeGlobPattern;
    ignoreFilesBy;
    mostFileCount;
    releaseTimeoutMs;
    trackingMap = new tracking_map_1.TrackingMap();
    test;
    startDataLoaded = true;
    updating = null;
    releaseTimeout = null;
    releaseImportedTimeout = null;
    timestamp = 0;
    /** May push more promises when updating, so there is a property. */
    updatePromises = [];
    /**
     * update request may come from track, or beFresh, we cant make sure they will have no conflict
     * so we need a promise to lock it to avoid two update task are executed simultaneously.
     */
    updatePromiseMap = new Map();
    constructor(documents, window, options) {
        this.documents = documents;
        this.window = window;
        this.startPath = options.startPath || null;
        this.alwaysIncludeGlobPattern = options.alwaysIncludeGlobPattern || null;
        this.ignoreFilesBy = options.ignoreFilesBy || [];
        this.mostFileCount = options.mostFileCount ?? Infinity;
        this.releaseTimeoutMs = options.releaseTimeoutMs ?? Infinity;
        this.test = new tracking_test_1.TrackingTest(options);
        if (this.startPath) {
            this.startDataLoaded = false;
        }
        // Clean long-unused imported only sources every 5mins.
        setInterval(this.clearImportedOnlyResources.bind(this), CheckUnUsedTimeInterval);
    }
    /** Update timestamp. */
    updateTimestamp(time) {
        this.timestamp = time;
    }
    /** When document opened or content changed from vscode editor. */
    onDocumentOpenOrContentChanged(document) {
        // No need to handle file opening because we have preloaded all the files.
        // Open and changed event will be distinguished by document version later.
        if (this.trackingMap.has(document.uri) || this.test.shouldTrackURI(document.uri)) {
            this.trackOpenedDocument(document);
        }
    }
    /** After document saved. */
    onDocumentSaved(document) {
        let fresh = this.trackingMap.isFresh(document.uri);
        // Since `onDidChangeWatchedFiles` event was triggered so frequently, we only do updating after saved.
        if (!fresh && this.updating) {
            this.updateFile(document.uri);
        }
    }
    /** After document closed. */
    onDocumentClosed(document) {
        if (this.trackingMap.has(document.uri)) {
            this.afterFileClosed(document.uri);
        }
    }
    /** After changes of files or folders. */
    async onWatchedFileOrFolderChanged(params) {
        for (let change of params.changes) {
            let uri = change.uri;
            let fsPath = vscode_uri_1.URI.parse(uri).fsPath;
            // New file or folder.
            if (change.type === vscode_languageserver_1.FileChangeType.Created) {
                // If haven't loaded whole workspace, no need to load newly created.
                // An issue for `@import ...` resources:
                // It's common that we import resources inside `node_modules`,
                // but we can't get notifications when those files changed outside of vscode.
                if (!this.startDataLoaded) {
                    return;
                }
                this.tryTrackFileOrFolder(fsPath, tracking_map_1.TrackingReasonMask.Included);
            }
            // File or folder that content changed.
            else if (change.type === vscode_languageserver_1.FileChangeType.Changed) {
                if (await fs.pathExists(fsPath)) {
                    let stat = await fs.stat(fsPath);
                    if (stat && stat.isFile()) {
                        if (this.test.shouldTrackFile(fsPath)) {
                            this.trackFile(fsPath, tracking_map_1.TrackingReasonMask.Included);
                        }
                    }
                }
            }
            // Deleted file or folder.
            else if (change.type === vscode_languageserver_1.FileChangeType.Deleted) {
                this.afterDirDeleted(uri);
            }
        }
    }
    /** Track file or folder. */
    async tryTrackFileOrFolder(fsPath, reason) {
        if (this.test.shouldExcludeFileOrFolder(fsPath)) {
            return;
        }
        if (!await fs.pathExists(fsPath)) {
            return;
        }
        let stat = await fs.stat(fsPath);
        if (stat.isDirectory()) {
            await this.tryTrackFolder(fsPath, reason);
        }
        else if (stat.isFile()) {
            let filePath = fsPath;
            if (this.test.shouldTrackFile(filePath)) {
                this.trackFile(filePath, reason);
            }
        }
    }
    /** Track folder. */
    async tryTrackFolder(folderPath, reason) {
        let filePathsGenerator = (0, file_walker_1.walkDirectoryToMatchFiles)(folderPath, this.ignoreFilesBy);
        let count = 0;
        for await (let absPath of filePathsGenerator) {
            if (this.test.shouldTrackFile(absPath)) {
                this.trackFile(absPath, reason);
                count++;
                if (count >= this.mostFileCount) {
                    this.window.showWarningMessage(`CSS Navigation limits scanning at most "${this.mostFileCount}" files for performance reason!`);
                    break;
                }
            }
        }
    }
    /**
     * Track more file, normally imported file.
     * or should be excluded by exclude glob path.
     * Note customized tracked document can't response to changes outside of vscode.
     */
    trackMoreFile(filePath, reason = tracking_map_1.TrackingReasonMask.Imported) {
        if (this.test.shouldIncludeFile(filePath)) {
            this.trackFile(filePath, reason);
        }
    }
    /** Track or re-track file, not validate whether should track here. */
    trackFile(filePath, reason) {
        let uri = vscode_uri_1.URI.file(filePath).toString();
        let hasTracked = this.trackingMap.has(uri);
        this.trackingMap.trackByReason(uri, reason);
        if (!hasTracked) {
            this.afterNewFileTracked(uri);
        }
    }
    /** Untrack a file. */
    untrackFileByURI(uri) {
        this.trackingMap.delete(uri);
        this.afterFileUntracked(uri);
    }
    /** Track or re-track opened file from document, or update tracking, no matter files inside or outside workspace. */
    trackOpenedDocument(document) {
        let uri = document.uri;
        let hasTracked = this.trackingMap.has(uri);
        let freshBefore = this.trackingMap.isFresh(uri);
        this.trackingMap.trackByDocument(document);
        let freshAfter = this.trackingMap.isFresh(uri);
        let expired = freshBefore && !freshAfter;
        if (expired) {
            this.afterFileExpired(uri);
        }
        else if (!hasTracked) {
            this.afterNewFileTracked(uri);
        }
    }
    /** After tracked a new file, will check if it's fresh. */
    afterNewFileTracked(uri) {
        this.onFileTracked(uri);
        if (this.updating) {
            this.updateFile(uri);
        }
    }
    /** After file or folder deleted from disk. */
    afterDirDeleted(deletedURI) {
        for (let uri of this.trackingMap.getURIs()) {
            if (uri.startsWith(deletedURI)) {
                this.untrackFileByURI(uri);
            }
        }
    }
    /** After knows that file get expired. */
    afterFileExpired(uri) {
        logger_1.Logger.log(`✏️ ${decodeURIComponent(uri)} expired`);
        this.onFileExpired(uri);
        if (this.updating) {
            this.updateFile(uri);
        }
    }
    /** After file get closed, decide whether untrack it. */
    afterFileClosed(uri) {
        this.trackingMap.removeReason(uri, tracking_map_1.TrackingReasonMask.Opened);
        if (!this.trackingMap.has(uri)) {
            this.afterFileUntracked(uri);
        }
    }
    /** After removed file from tracking. */
    afterFileUntracked(uri) {
        logger_1.Logger.log(`🗑️ ${decodeURIComponent(uri)} removed`);
        this.onFileUntracked(uri);
    }
    /** After file tracked. */
    onFileTracked(_uri) { }
    /** After file expired. */
    onFileExpired(_uri) { }
    /** After file untracked. */
    onFileUntracked(_uri) { }
    /** Ensure all the content be fresh. */
    async beFresh() {
        if (this.trackingMap.allFresh) {
            return;
        }
        if (this.updating) {
            await this.updating;
        }
        else {
            this.updating = this.doUpdating();
            await this.updating;
            this.updating = null;
            this.trackingMap.setAllFresh(true);
        }
        this.resetReleaseTimeout();
    }
    /**
     * Ensure specified content be fresh, if it has been included.
     * Normally use this only for imported sources.
     */
    async uriBeFresh(uri) {
        if (!this.trackingMap.has(uri)) {
            return;
        }
        if (!this.trackingMap.isFresh(uri)) {
            await this.updateFile(uri);
        }
        this.trackingMap.setUseTime(uri, this.timestamp);
    }
    /** Update all the contents that need to be updated. */
    async doUpdating() {
        if (!this.startDataLoaded) {
            await this.loadStartData();
        }
        this.updatePromises = [];
        logger_1.Logger.timeStart('update');
        for (let uri of this.trackingMap.getURIs()) {
            if (!this.trackingMap.isFresh(uri)) {
                this.updateFile(uri);
            }
            this.trackingMap.setUseTime(uri, this.timestamp);
        }
        // May push more promises when updating.
        for (let i = 0; i < this.updatePromises.length; i++) {
            let promise = this.updatePromises[i];
            await promise;
        }
        let updatedCount = this.updatePromises.length;
        logger_1.Logger.timeEnd('update', `${updatedCount > 0 ? updatedCount : 'No'} files loaded`);
        this.updatePromises = [];
    }
    /** Load all files inside `startPath` and `alwaysIncludeGlobPattern`, and also all opened documents. */
    async loadStartData() {
        logger_1.Logger.timeStart('track');
        for (let document of this.documents.all()) {
            if (this.test.shouldTrackURI(document.uri)) {
                this.trackOpenedDocument(document);
            }
        }
        if (this.alwaysIncludeGlobPattern) {
            let alwaysIncludePaths = await (0, util_1.promisify)(glob_1.glob)(this.alwaysIncludeGlobPattern, {
                cwd: this.startPath || undefined,
                absolute: true,
            });
            for (let filePath of alwaysIncludePaths) {
                filePath = vscode_uri_1.URI.file(filePath).fsPath;
                if (this.test.shouldIncludeFile(filePath)) {
                    this.trackFile(filePath, tracking_map_1.TrackingReasonMask.Included);
                }
            }
        }
        await this.tryTrackFileOrFolder(this.startPath, tracking_map_1.TrackingReasonMask.Included);
        logger_1.Logger.timeEnd('track', `${this.trackingMap.size()} files tracked`);
        this.startDataLoaded = true;
    }
    /** Update one file, returns whether updated. */
    async updateFile(uri) {
        let promise = this.updatePromiseMap.get(uri);
        if (promise) {
            await promise;
        }
        else {
            promise = this.doingUpdate(uri);
            this.updatePromiseMap.set(uri, promise);
            this.updatePromises.push(promise);
            await promise;
            this.updatePromiseMap.delete(uri);
        }
        return true;
    }
    /** Doing update and returns a promise. */
    async doingUpdate(uri) {
        if (!this.trackingMap.has(uri)) {
            return;
        }
        let document = this.trackingMap.getDocument(uri);
        if (!document) {
            document = await this.loadDocument(uri);
            this.trackingMap.setDocument(uri, document);
        }
        if (document) {
            await this.parseDocument(uri, document);
            this.trackingMap.setFresh(uri, true);
            logger_1.Logger.log(`📃 ${decodeURIComponent(uri)} loaded`);
        }
    }
    /** Load text content and create one document. */
    async loadDocument(uri) {
        let languageId = path.extname(uri).slice(1).toLowerCase();
        let document = null;
        try {
            let text = (await fs.readFile(vscode_uri_1.URI.parse(uri).fsPath)).toString('utf8');
            // Very low resource usage for creating one document.
            document = vscode_languageserver_textdocument_1.TextDocument.create(uri, languageId, 1, text);
        }
        catch (err) {
            console.error(err);
        }
        return document;
    }
    /** Parsed document. */
    async parseDocument(_uri, _document) { }
    /** Reset release timeout if needed. */
    resetReleaseTimeout() {
        if (this.releaseTimeout) {
            clearTimeout(this.releaseTimeout);
        }
        if (isFinite(this.releaseTimeoutMs)) {
            this.releaseTimeout = setTimeout(this.releaseResources.bind(this), this.releaseTimeoutMs);
        }
    }
    /** Release all resources. */
    releaseResources() {
        let size = this.trackingMap.size();
        if (size === 0) {
            return;
        }
        this.startDataLoaded = false;
        this.trackingMap.clear();
        logger_1.Logger.log(`⏰ All ${size} long-unused resources released`);
        this.onReleaseResources();
    }
    onReleaseResources() { }
    /** Clean imported only resource. */
    clearImportedOnlyResources() {
        let timestamp = logger_1.Logger.getTimestamp() - CheckUnUsedTimeInterval;
        let uris = this.trackingMap.getExpiredURIs(timestamp);
        if (uris.length === 0) {
            return;
        }
        for (let uri of uris) {
            this.untrackFileByURI(uri);
        }
        logger_1.Logger.log(`⏰ ${uris.length} long-unused imported resources released`);
    }
}
exports.FileTracker = FileTracker;
//# sourceMappingURL=file-tracker.js.map