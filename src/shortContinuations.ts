import * as vscode from 'vscode';
import { JavaController } from './javaController';
import { getGame } from './utils';
import { compact } from './longCompletions';

export class LudiiAutocomplete implements vscode.CompletionItemProvider {
    private javaController;

    public constructor(private extensionUri: vscode.Uri) {
        this.javaController = new JavaController('approaches.symbolic.api.AutocompleteEndpoint', extensionUri);
    }

    public provideCompletionItems(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext
    ): Thenable<vscode.CompletionItem[]> {

        return new Promise((resolve, reject) => {
            let completionItems: vscode.CompletionItem[] = [];

            const docText = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
            const game = compact(getGame(docText));

            // Necessary bacuse intellisense will match completion untill the previous space or braket, as if they where continuations of the word
            let prefix = "";
            if (!docText.endsWith(" ") && !docText.endsWith("\n")) {
                prefix = game.substring(game.lastIndexOf(" ")).trim();
                const lastBraket = Math.max(prefix.lastIndexOf("("), prefix.lastIndexOf(")"), prefix.lastIndexOf("{"), prefix.lastIndexOf("}"));
                if (lastBraket > -1)
                    prefix = prefix.substring(lastBraket + 1);
            }

            

            this.javaController.write(game);
            
            const dataHandler = (text: string) => {
                const completions = text.split('||');
                
                completions.forEach((completion: string) => {
                    const [label, detail] = completion.split('|');
                    console.log(completion, "->", label, "&", detail);
                    const item = new vscode.CompletionItem(prefix + label);
                    //item.detail = detail;
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