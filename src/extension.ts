import * as vscode from 'vscode';
import { disposeControllers } from './javaController';
import { LudiiAutocomplete } from './autocomplete';
import { LLMCompletionProvider } from './completionProvider';
import { CompletionViewProvider }from './ui';

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


    const provider = new CompletionViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(CompletionViewProvider.viewType, provider));

	context.subscriptions.push(
		vscode.commands.registerCommand('ludii.findCompletions', () => {
            console.log("findCompletions");
			provider.findCompletions();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('ludii.clearCompletions', () => {
			provider.clearCompletions();
		}));


}

export function deactivate() {
    disposeControllers();
}
