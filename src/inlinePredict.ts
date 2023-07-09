import * as vscode from 'vscode';
const https = require('https');
import { JavaController } from './javaController';
import { getGame, getComments } from './utils';

export class LudiiPredictionProvider implements vscode.InlineCompletionItemProvider {

    private compiler = new LudiiCompiler();

    public provideInlineCompletionItems(
        document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.InlineCompletionItem[]> {
        
        return new Promise((resolve, reject) => {
            console.log(context.triggerKind);
            if (context.triggerKind == 1)
                return resolve([]);

            const game = getGame(document.getText());
            console.log("PROVIDING INLINE COMPLETION ITEMS", game);
            
            const comments = getComments(document.getText());
            console.log("COMMENTS: ", comments);
            this.infer("Construct a Ludii game based on the following description", comments, game).then(async (completions: [string]) => {
                
                let compiled = [];
                for (let completion of completions) {
                    console.log("PREDICTION: ", completion);
                    compiled.push({"partial": game + completion, "score": completion.length});
                    //compiled.push(await this.compiler.compile(game + completion));
                    console.log("COMPILED: ", compiled[compiled.length - 1]);
                }

                compiled.sort((a, b) => b.score - a.score);             
                resolve(compiled.map(compiled => new vscode.InlineCompletionItem(compiled.partial.substring(game.length))));
            }).catch((error: any) => {
                console.log(error);
                reject([]);
            });
            
            
        });
    }

    public async infer(instruction: string, input: string, partial: string): Promise<[string]> {
        const url = new URL('https://762a-34-125-86-78.ngrok.io');

        url.searchParams.append('instruction', instruction);
        url.searchParams.append('input', input);
        url.searchParams.append('partial', partial);
        url.searchParams.append('temperature', "0.5");
        url.searchParams.append('max_new_tokens', "100");
        url.searchParams.append('n', "5");

        return new Promise((resolve, reject) => {
            // wait 1 second
            //setTimeout(() => { resolve("test") }, 2000);

            https.get(url.href, (res: any) => {
                let data = '';

                // A chunk of data has been received.
                res.on('data', (chunk: Buffer) => {
                    data += chunk;
                });

                // The whole response has been received.
                res.on('end', () => {
                    resolve(JSON.parse(data).completions);
                });

            }).on("error", (err: Error) => {
                console.log("Error: " + err.message);
                reject(err);
            });
        });
    }


    public dispose() {
        // TODO
    }
}





export class LudiiCompiler {
    private javaController = new JavaController('approaches.symbolic.api.Compile');

    public compile(game: string): Promise<{compiles: boolean, score: number, partial: string}> {

        return new Promise(async (resolve, reject) => {
            this.javaController.write(game);

            let compiles: boolean;
            let score: number;
            let compilableSection: string;

            const errorHandler = (data: any) => {
                console.log('FAILED: ' + data.toString());
                reject([]);
            };

            compiles = parseInt(await this.javaController.read()) == 1;
            score = parseFloat(await this.javaController.read());
            compilableSection = await this.javaController.read();
            resolve({compiles: compiles, score: score, partial: compilableSection});
        });
    }
}