# Details

Date : 2025-01-03 20:43:35

Directory c:\\Users\\FF\\Desktop\\vscode\\vscode-css-navigation\\server\\src

Total : 43 files,  4043 codes, 981 comments, 1309 blanks, all 6333 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [server/src/completion.ts](/server/src/completion.ts) | TypeScript | 76 | 10 | 25 | 111 |
| [server/src/definition.ts](/server/src/definition.ts) | TypeScript | 161 | 33 | 66 | 260 |
| [server/src/helpers/file-tracker.ts](/server/src/helpers/file-tracker.ts) | TypeScript | 415 | 76 | 121 | 612 |
| [server/src/helpers/file-walker.ts](/server/src/helpers/file-walker.ts) | TypeScript | 122 | 12 | 45 | 179 |
| [server/src/helpers/file.ts](/server/src/helpers/file.ts) | TypeScript | 28 | 0 | 11 | 39 |
| [server/src/helpers/index.ts](/server/src/helpers/index.ts) | TypeScript | 4 | 0 | 1 | 5 |
| [server/src/helpers/logger.ts](/server/src/helpers/logger.ts) | TypeScript | 90 | 14 | 32 | 136 |
| [server/src/hover.ts](/server/src/hover.ts) | TypeScript | 72 | 7 | 25 | 104 |
| [server/src/languages/index.ts](/server/src/languages/index.ts) | TypeScript | 5 | 0 | 0 | 5 |
| [server/src/languages/parts/index.ts](/server/src/languages/parts/index.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [server/src/languages/parts/part-comparer.ts](/server/src/languages/parts/part-comparer.ts) | TypeScript | 62 | 27 | 15 | 104 |
| [server/src/languages/parts/part-convertor.ts](/server/src/languages/parts/part-convertor.ts) | TypeScript | 232 | 21 | 52 | 305 |
| [server/src/languages/parts/part-css-selector.ts](/server/src/languages/parts/part-css-selector.ts) | TypeScript | 163 | 37 | 53 | 253 |
| [server/src/languages/parts/part.ts](/server/src/languages/parts/part.ts) | TypeScript | 123 | 58 | 50 | 231 |
| [server/src/languages/resolver/index.ts](/server/src/languages/resolver/index.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [server/src/languages/resolver/module.ts](/server/src/languages/resolver/module.ts) | TypeScript | 46 | 11 | 14 | 71 |
| [server/src/languages/resolver/path.ts](/server/src/languages/resolver/path.ts) | TypeScript | 70 | 17 | 25 | 112 |
| [server/src/languages/scanners/any.ts](/server/src/languages/scanners/any.ts) | TypeScript | 177 | 29 | 48 | 254 |
| [server/src/languages/scanners/css-sass-indented.ts](/server/src/languages/scanners/css-sass-indented.ts) | TypeScript | 137 | 29 | 60 | 226 |
| [server/src/languages/scanners/css-selector.ts](/server/src/languages/scanners/css-selector.ts) | TypeScript | 99 | 239 | 39 | 377 |
| [server/src/languages/scanners/css.ts](/server/src/languages/scanners/css.ts) | TypeScript | 117 | 31 | 41 | 189 |
| [server/src/languages/scanners/html.ts](/server/src/languages/scanners/html.ts) | TypeScript | 254 | 58 | 102 | 414 |
| [server/src/languages/scanners/index.ts](/server/src/languages/scanners/index.ts) | TypeScript | 5 | 0 | 0 | 5 |
| [server/src/languages/services/base-service-map.ts](/server/src/languages/services/base-service-map.ts) | TypeScript | 106 | 14 | 41 | 161 |
| [server/src/languages/services/base-service.ts](/server/src/languages/services/base-service.ts) | TypeScript | 161 | 42 | 53 | 256 |
| [server/src/languages/services/css-service-map.ts](/server/src/languages/services/css-service-map.ts) | TypeScript | 59 | 6 | 17 | 82 |
| [server/src/languages/services/css-service.ts](/server/src/languages/services/css-service.ts) | TypeScript | 10 | 1 | 5 | 16 |
| [server/src/languages/services/html-service-map.ts](/server/src/languages/services/html-service-map.ts) | TypeScript | 20 | 6 | 8 | 34 |
| [server/src/languages/services/html-service.ts](/server/src/languages/services/html-service.ts) | TypeScript | 36 | 10 | 12 | 58 |
| [server/src/languages/services/index.ts](/server/src/languages/services/index.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [server/src/languages/trees/any-node.ts](/server/src/languages/trees/any-node.ts) | TypeScript | 43 | 6 | 14 | 63 |
| [server/src/languages/trees/css-node.ts](/server/src/languages/trees/css-node.ts) | TypeScript | 34 | 5 | 15 | 54 |
| [server/src/languages/trees/css-tree.ts](/server/src/languages/trees/css-tree.ts) | TypeScript | 224 | 20 | 59 | 303 |
| [server/src/languages/trees/html-node.ts](/server/src/languages/trees/html-node.ts) | TypeScript | 51 | 11 | 18 | 80 |
| [server/src/languages/trees/html-tree.ts](/server/src/languages/trees/html-tree.ts) | TypeScript | 260 | 36 | 61 | 357 |
| [server/src/languages/trees/index.ts](/server/src/languages/trees/index.ts) | TypeScript | 4 | 0 | 1 | 5 |
| [server/src/languages/trees/picker.ts](/server/src/languages/trees/picker.ts) | TypeScript | 121 | 34 | 38 | 193 |
| [server/src/languages/trees/types.ts](/server/src/languages/trees/types.ts) | TypeScript | 1 | 0 | 2 | 3 |
| [server/src/languages/trees/utils.ts](/server/src/languages/trees/utils.ts) | TypeScript | 165 | 43 | 43 | 251 |
| [server/src/languages/utils.ts](/server/src/languages/utils.ts) | TypeScript | 42 | 14 | 16 | 72 |
| [server/src/reference.ts](/server/src/reference.ts) | TypeScript | 61 | 6 | 21 | 88 |
| [server/src/server.ts](/server/src/server.ts) | TypeScript | 166 | 17 | 57 | 240 |
| [server/src/utils.ts](/server/src/utils.ts) | TypeScript | 11 | 1 | 3 | 15 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)