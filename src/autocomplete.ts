import * as vscode from 'vscode';
import { JavaController } from './javaController';
import { getGame } from './utils';
import { compact } from './codeProvider';

export class LudiiAutocomplete implements vscode.CompletionItemProvider {
    private javaController;

    public constructor(private extensionUri: vscode.Uri) {
        this.javaController = new JavaController('approaches.symbolic.api.Autocomplete', extensionUri);
    }

    public provideCompletionItems(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext
    ): Thenable<vscode.CompletionItem[]> {

        return new Promise((resolve, reject) => {
            let completionItems: vscode.CompletionItem[] = [];

            let docText = document.getText(new vscode.Range(new vscode.Position(0, 0), position));

            this.javaController.write(compact(getGame(docText)));
            
            const dataHandler = (text: string) => {

                text = text.substring(0, text.length - 2);
                const completions = text.split('||');
                
                completions.forEach((completion: string) => {
                    const [label, detail] = completion.split('|');
                    console.log(completion, "->", label, "&", detail);
                    const item = new vscode.CompletionItem(label);
                    item.detail = detail;
                    completionItems.push(item);
                });

                resolve(completionItems);
            };

            const errorHandler = (data: any) => {
                console.log('FAILED: ' + data.toString());
                reject([]);
            };

            this.javaController.read().then(dataHandler).catch(errorHandler);
        });
    }
}