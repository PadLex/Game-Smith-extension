"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const javaController_1 = require("./javaController");
const autocomplete_1 = require("./autocomplete");
const inlinePredict_1 = require("./inlinePredict");
const ludiiCompletionItemProvider = new autocomplete_1.LudiiAutocomplete();
const ludiiPredictionProvider = new inlinePredict_1.LudiiPredictionProvider();
function activate(context) {
    console.log('Ludii started');
    // context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
    //     { language: 'ludii', scheme: 'file' },
    //     ludiiCompletionItemProvider
    // ));
    context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider({ language: 'ludii', scheme: 'file' }, ludiiPredictionProvider));
}
exports.activate = activate;
function deactivate() {
    (0, javaController_1.disposeControllers)();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map