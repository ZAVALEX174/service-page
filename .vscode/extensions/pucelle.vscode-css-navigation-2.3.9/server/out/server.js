"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const languages_1 = require("./languages");
const utils_1 = require("./utils");
const core_1 = require("./core");
const definition_1 = require("./definition");
const completion_1 = require("./completion");
const reference_1 = require("./reference");
const hover_1 = require("./hover");
require("../../client/out/types");
const css_variable_color_1 = require("./css-variable-color");
let connection = (0, vscode_languageserver_1.createConnection)(vscode_languageserver_1.ProposedFeatures.all);
let configuration;
let documents = new vscode_languageserver_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let server;
//////// Debug Help
// 1. How to inspect textmate tokens: Ctrl + Shift + P, then choose `Inspect Editor Tokens and Scopes`
// 2. How to inspect completion details: Ctrl + /
// Do initializing.
connection.onInitialize((params) => {
    let options = params.initializationOptions;
    configuration = options.configuration;
    server = new CSSNavigationServer(options);
    // Initialize console channel and log level.
    core_1.Logger.setLogEnabled(configuration.enableLogLevelMessage);
    core_1.Logger.pipeTo(connection);
    // Print error messages after unhandled rejection promise.
    process.on('unhandledRejection', function (reason) {
        core_1.Logger.warn("Unhandled Rejection: " + reason);
    });
    return {
        capabilities: {
            textDocumentSync: {
                openClose: true,
                change: vscode_languageserver_1.TextDocumentSyncKind.Full
            },
            completionProvider: configuration.enableIdAndClassNameCompletion ? {
                resolveProvider: false
            } : undefined,
            definitionProvider: configuration.enableGoToDefinition,
            referencesProvider: configuration.enableFindAllReferences,
            workspaceSymbolProvider: configuration.enableWorkspaceSymbols,
            hoverProvider: configuration.enableHover,
            colorProvider: configuration.enableCSSVariableColor,
        }
    };
});
// Listening events.
connection.onInitialized(() => {
    if (configuration.enableGoToDefinition) {
        connection.onDefinition(core_1.Logger.logQuerierExecutedTime(server.findDefinitions.bind(server), 'definition'));
    }
    if (configuration.enableWorkspaceSymbols) {
        connection.onWorkspaceSymbol(core_1.Logger.logQuerierExecutedTime(server.findSymbols.bind(server), 'workspace symbol'));
    }
    if (configuration.enableIdAndClassNameCompletion) {
        connection.onCompletion(core_1.Logger.logQuerierExecutedTime(server.getCompletionItems.bind(server), 'completion'));
    }
    if (configuration.enableFindAllReferences) {
        connection.onReferences(core_1.Logger.logQuerierExecutedTime(server.findReferences.bind(server), 'reference'));
    }
    if (configuration.enableHover) {
        connection.onHover(core_1.Logger.logQuerierExecutedTime(server.findHover.bind(server), 'hover'));
    }
    if (configuration.enableCSSVariableColor) {
        connection.onDocumentColor(core_1.Logger.logQuerierExecutedTime(server.getDocumentCSSVariableColors.bind(server), 'hover'));
        // Just ensure no error happens.
        connection.onColorPresentation(() => null);
    }
});
documents.listen(connection);
connection.listen();
class CSSNavigationServer {
    options;
    cssServiceMap;
    htmlServiceMap;
    constructor(options) {
        this.options = options;
        this.htmlServiceMap = new languages_1.HTMLServiceMap(documents, connection.window, {
            includeFileGlobPattern: (0, utils_1.generateGlobPatternByExtensions)(configuration.activeHTMLFileExtensions),
            excludeGlobPattern: (0, utils_1.generateGlobPatternByPatterns)(configuration.excludeGlobPatterns) || undefined,
            startPath: options.workspaceFolderPath,
            ignoreFilesBy: configuration.ignoreFilesBy,
            // Track at most 1000 html like files.
            mostFileCount: 1000,
            // Release resources if has not been used for 30 mins.
            releaseTimeoutMs: 30 * 60 * 1000,
        });
        this.cssServiceMap = new languages_1.CSSServiceMap(documents, connection.window, {
            includeFileGlobPattern: (0, utils_1.generateGlobPatternByExtensions)(configuration.activeCSSFileExtensions),
            excludeGlobPattern: (0, utils_1.generateGlobPatternByPatterns)(configuration.excludeGlobPatterns) || undefined,
            alwaysIncludeGlobPattern: (0, utils_1.generateGlobPatternByPatterns)(configuration.alwaysIncludeGlobPatterns) || undefined,
            startPath: options.workspaceFolderPath,
            ignoreFilesBy: configuration.ignoreFilesBy,
            // Track at most 1000 css files.
            mostFileCount: 1000,
        });
        let serviceMaps = [this.htmlServiceMap, this.cssServiceMap];
        // All those events can't been registered for twice, or the first one will not work.
        documents.onDidChangeContent((event) => {
            for (let map of serviceMaps) {
                map.onDocumentOpenOrContentChanged(event.document);
            }
        });
        documents.onDidSave((event) => {
            for (let map of serviceMaps) {
                map.onDocumentSaved(event.document);
            }
        });
        documents.onDidClose((event) => {
            for (let map of serviceMaps) {
                map.onDocumentClosed(event.document);
            }
        });
        connection.onDidChangeWatchedFiles((params) => {
            for (let map of serviceMaps) {
                map.onWatchedFileOrFolderChanged(params);
            }
        });
        core_1.Logger.log(`📁 Server for workspace "${path.basename(this.options.workspaceFolderPath)}" started.`);
    }
    updateTimestamp(time) {
        this.htmlServiceMap.updateTimestamp(time);
        this.cssServiceMap.updateTimestamp(time);
    }
    /** Provide finding definitions service. */
    async findDefinitions(params, time) {
        this.updateTimestamp(time);
        let documentIdentifier = params.textDocument;
        let document = documents.get(documentIdentifier.uri);
        if (!document) {
            return null;
        }
        let position = params.position;
        let offset = document.offsetAt(position);
        return (0, definition_1.findDefinitions)(document, offset, this.htmlServiceMap, this.cssServiceMap, configuration);
    }
    /** Provide finding symbol service. */
    async findSymbols(symbol, time) {
        this.updateTimestamp(time);
        let query = symbol.query;
        // Returns nothing if haven't inputted.
        if (!query) {
            return null;
        }
        return await this.cssServiceMap.findSymbols(query);
    }
    /** Provide auto completion service for HTML or CSS document. */
    async getCompletionItems(params, time) {
        this.updateTimestamp(time);
        let documentIdentifier = params.textDocument;
        let document = documents.get(documentIdentifier.uri);
        if (!document) {
            return null;
        }
        // HTML or CSS file.
        let position = params.position;
        let offset = document.offsetAt(position);
        return (0, completion_1.getCompletionItems)(document, offset, this.htmlServiceMap, this.cssServiceMap, configuration);
    }
    /** Provide finding reference service. */
    async findReferences(params, time) {
        this.updateTimestamp(time);
        let documentIdentifier = params.textDocument;
        let document = documents.get(documentIdentifier.uri);
        if (!document) {
            return null;
        }
        let position = params.position;
        let offset = document.offsetAt(position);
        return (0, reference_1.findReferences)(document, offset, this.htmlServiceMap, this.cssServiceMap, configuration);
    }
    /** Provide finding hover service. */
    async findHover(params, time) {
        this.updateTimestamp(time);
        let documentIdentifier = params.textDocument;
        let document = documents.get(documentIdentifier.uri);
        if (!document) {
            return null;
        }
        let position = params.position;
        let offset = document.offsetAt(position);
        return (0, hover_1.findHover)(document, offset, this.htmlServiceMap, this.cssServiceMap, configuration);
    }
    /** Provide document css variable color service. */
    async getDocumentCSSVariableColors(params, time) {
        this.updateTimestamp(time);
        let documentIdentifier = params.textDocument;
        let document = documents.get(documentIdentifier.uri);
        if (!document) {
            return null;
        }
        return (0, css_variable_color_1.getCSSVariableColors)(document, this.htmlServiceMap, this.cssServiceMap, configuration);
    }
}
//# sourceMappingURL=server.js.map