import * as vscode from 'vscode';
import { disposeControllers } from './javaController';
import { LudiiAutocomplete } from './autocomplete';
import { CodeProvider } from './codeProvider';
import { CompletionViewProvider }from './ui';
import { DescriptionProvider } from './descriptionProvider';

// const ludiiCompletionItemProvider = new LudiiAutocomplete();
// const ludiiPredictionProvider = new LudiiPredictionProvider();

const codeProvider = new CodeProvider();
const descriptionProvider = new DescriptionProvider("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");

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


    const provider = new CompletionViewProvider(context.extensionUri, codeProvider, descriptionProvider);

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
