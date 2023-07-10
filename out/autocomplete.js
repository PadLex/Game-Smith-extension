"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LudiiAutocomplete = void 0;
const vscode = require("vscode");
const javaController_1 = require("./javaController");
const utils_1 = require("./utils");
class LudiiAutocomplete {
    javaController = new javaController_1.JavaController('approaches.symbolic.api.Autocomplete');
    provideCompletionItems(document, position, token, context) {
        return new Promise((resolve, reject) => {
            let completionItems = [];
            let docText = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
            this.javaController.write((0, utils_1.getGame)(docText));
            const dataHandler = (text) => {
                text = text.substring(0, text.length - 2);
                const completions = text.split('||');
                completions.forEach((completion) => {
                    const [label, detail] = completion.split('|');
                    console.log(completion, "->", label, "&", detail);
                    const item = new vscode.CompletionItem(label);
                    item.detail = detail;
                    completionItems.push(item);
                });
                resolve(completionItems);
            };
            const errorHandler = (data) => {
                console.log('FAILED: ' + data.toString());
                reject([]);
            };
            this.javaController.read().then(dataHandler).catch(errorHandler);
        });
    }
}
exports.LudiiAutocomplete = LudiiAutocomplete;
//# sourceMappingURL=autocomplete.js.map