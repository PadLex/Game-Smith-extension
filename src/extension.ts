import * as vscode from 'vscode';
import { disposeControllers } from './javaController';
import { LudiiAutocomplete } from './autocomplete';
import { LudiiPredictionProvider } from './inlinePredict';
import { ColorsViewProvider }from './ui';

// const ludiiCompletionItemProvider = new LudiiAutocomplete();
// const ludiiPredictionProvider = new LudiiPredictionProvider();

export function activate(context: vscode.ExtensionContext) {
    console.log('Ludii started');

    // context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
    //     { language: 'ludii', scheme: 'file' },
    //     ludiiCompletionItemProvider
    // ));

    // context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider(
    //     { language: 'ludii', scheme: 'file' },
    //     ludiiPredictionProvider
    // ));


    const provider = new ColorsViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ColorsViewProvider.viewType, provider));

	context.subscriptions.push(
		vscode.commands.registerCommand('ludii.addColor', () => {
			provider.addColor();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('ludii.clearColors', () => {
			provider.clearColors();
		}));


}

export function deactivate() {
    disposeControllers();
}
