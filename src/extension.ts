import * as vscode from 'vscode';
import { disposeControllers } from './javaController';
import { LudiiAutocomplete } from './autocomplete';
import { LudiiPredictionProvider } from './inlinePredict';

const ludiiCompletionItemProvider = new LudiiAutocomplete();
const ludiiPredictionProvider = new LudiiPredictionProvider();

export function activate(context: vscode.ExtensionContext) {
    console.log('Ludii started');

    // context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
    //     { language: 'ludii', scheme: 'file' },
    //     ludiiCompletionItemProvider
    // ));

    context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider(
        { language: 'ludii', scheme: 'file' },
        ludiiPredictionProvider
    ));
}

export function deactivate() {
    disposeControllers();
}
