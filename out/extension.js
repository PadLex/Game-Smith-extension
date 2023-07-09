"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const javaController_1 = require("./javaController");
const ui_1 = require("./ui");
// const ludiiCompletionItemProvider = new LudiiAutocomplete();
// const ludiiPredictionProvider = new LudiiPredictionProvider();
function activate(context) {
    console.log('Ludii started');
    // context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
    //     { language: 'ludii', scheme: 'file' },
    //     ludiiCompletionItemProvider
    // ));
    // context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider(
    //     { language: 'ludii', scheme: 'file' },
    //     ludiiPredictionProvider
    // ));
    const provider = new ui_1.ColorsViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(ui_1.ColorsViewProvider.viewType, provider));
    context.subscriptions.push(vscode.commands.registerCommand('ludii.addColor', () => {
        provider.addColor();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ludii.clearColors', () => {
        provider.clearColors();
    }));
}
exports.activate = activate;
function deactivate() {
    (0, javaController_1.disposeControllers)();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map