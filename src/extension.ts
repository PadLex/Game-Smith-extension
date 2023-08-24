import * as vscode from 'vscode';
import { disposeControllers } from './javaController';
import { LudiiAutocomplete } from './autocomplete';
import { CodeProvider } from './codeProvider';
import { CompletionViewProvider }from './ui';
import { DescriptionProvider } from './descriptionProvider';
import { startGame } from './play';
import { subscribeExperiment } from './experiment';

/**
 * This file is the entry point for the extension. It maps VSCode events to their corresponding implementations across the codebase.
 */


let ludiiCompletionItemProvider: LudiiAutocomplete | undefined;
let codeProvider: CodeProvider | undefined;
let descriptionProvider: DescriptionProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Ludii started');

    console.log(context.extensionUri)

    codeProvider = new CodeProvider(context.extensionUri);
    descriptionProvider = new DescriptionProvider(context.extensionUri);
    ludiiCompletionItemProvider = new LudiiAutocomplete(context.extensionUri);

    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
        { language: 'ludii', scheme: 'file' },
        ludiiCompletionItemProvider
    ));

    const provider = new CompletionViewProvider(context.extensionUri, codeProvider, descriptionProvider);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(CompletionViewProvider.viewType, provider));

	context.subscriptions.push(
		vscode.commands.registerCommand('ludii.findLegacyCompletions', () => {
            codeProvider?.useLegacyCompiler();
			provider.findCompletions();
		})
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ludii.findPartialCompletions', () => {
            codeProvider?.usePartialCompiler();
            provider.findCompletions();
        })
    );

	context.subscriptions.push(
		vscode.commands.registerCommand('ludii.clearCompletions', () => {
			provider.clearCompletions();
		})
    );

    context.subscriptions.push(
		vscode.commands.registerCommand('ludii.startDesktopApp', () => {
            if (vscode.window.activeTextEditor) {
                vscode.window.activeTextEditor.document.save();
                startGame(context.extensionUri, vscode.window.activeTextEditor.document.uri)
            }
		})
    );


    subscribeExperiment(context);
    
}

export function deactivate() {
    disposeControllers();
}

