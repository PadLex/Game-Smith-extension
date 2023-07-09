import * as vscode from 'vscode';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
const https = require('https');

export class LudiiPredictionProvider implements vscode.InlineCompletionItemProvider {

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
            this.infer("Construct a Ludii game based on the following description", comments, game).then((completions: [string]) => {
                console.log("PREDICTIONS: ", completions);                
                resolve(completions.map(completion => new vscode.InlineCompletionItem(completion)));
            }).catch((error: any) => {
                console.log(error);
                reject([]);
            });
            
            
        });
    }

    public async infer(instruction: string, input: string, partial: string): Promise<[string]> {
        const url = new URL('https://f915-34-124-202-59.ngrok.io');

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

function getGame(text: string): string {
    text = text.replace(/(^|\n)\s*\/\/.*?($|\n)/g, '\n'); // Remove comments
    text = text.replace(/\n/g, ' '); // Remove newlines
    text = text.trim();
    return text;
}

function getComments(text: string): string {
    let commentLines = text.match(/(^|\n)\s*\/\/.*?($|\n)/g);

    let commentContents = "";
    if (commentLines) {
        commentContents += commentLines.map(line => line.replace(/(^|\n)\s*\/\/\s?/, '').trim()) + ' ';
    }
    return commentContents;
}

let activeControllers: JavaController[] = []
export class JavaController {
    private javaProcess: ChildProcessWithoutNullStreams;
    private keepAlive: boolean = true;
    private lock = false;

    constructor(javaClass: string) {
        this.javaProcess = this.spawnJavaProcess(javaClass);
        activeControllers.push(this);
    }

    public write(text: string) {
        console.log('\nPROVIDING:', text);
        if (this.lock) throw "Can not write bacause the previous read operation is ongoing."; //TODO check if lock is necessary
        this.javaProcess.stdin.write(text + '\n');
    }

    public read(dataHandler: ((text: string) => void), errorHandler: (data: any) => void) {
        this.lock = true;
        let result = '';
        this.javaProcess.stdout.on('data', (data: Buffer) => {
            console.log('PARTIAL: ', data.at(data.length - 1));
            const dataString = data.toString();
            result += dataString;
            if (dataString.endsWith('\n')) { // TODO check if I broke something because it was '||\n'
                console.log('SUCCESS: ' + dataString);
                dataHandler(result.substring(0, result.length - 1));
                this.lock = false;
            }

            // Clen-up
            this.javaProcess.stdout.removeListener('data', dataHandler);
            this.javaProcess.stderr.removeListener('error', errorHandler);
        });

        this.javaProcess.stderr.on('error', (data: any) => {
            this.lock = false;

            // Clen-up
            this.javaProcess.stdout.removeListener('data', dataHandler);
            this.javaProcess.stderr.removeListener('error', errorHandler);

            errorHandler(data);
        });
    }

    public spawnJavaProcess(javaClass: string): ChildProcessWithoutNullStreams {
        const projectRoot = '/Users/alex/Documents/Marble/Ludii/';
        const javaPath = [
            'Generation/bin',
            'Common/bin',
            'Common/lib/json-20180813.jar',
            'Common/lib/Trove4j_ApacheCommonsRNG.jar',
            'Core/bin',
            'Core/lib/jfreesvg-3.4.jar',
            'Language/bin'
        ].map(module => projectRoot + module).join(':');
    
        const javaProcess = spawn('java', ['-cp', javaPath, javaClass]);

        javaProcess.on('exit', () => {
            if (this.keepAlive) {
                console.log('Java process exited. Restarting...');
                this.javaProcess = this.spawnJavaProcess(javaClass);
            }
        });

        javaProcess.stdout.once('data', data => console.log('Startup:', data.toString()));

        return javaProcess;
    }

    public dispose() {
        this.keepAlive = false;
        this.javaProcess.kill();
    }
}

export class LudiiAutocomplete implements vscode.CompletionItemProvider {
    private javaController = new JavaController('approaches.symbolic.api.Autocomplete');

    public provideCompletionItems(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext
    ): Thenable<vscode.CompletionItem[]> {

        return new Promise((resolve, reject) => {
            let completionItems: vscode.CompletionItem[] = [];

            let docText = document.getText(new vscode.Range(new vscode.Position(0, 0), position));

            this.javaController.write(getGame(docText));
            
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

            this.javaController.read(dataHandler, errorHandler);
        });
    }
}

export class LudiiCompiler {
    private javaController = new JavaController('approaches.symbolic.api.Compile');

    public compile(game: string): Promise<[boolean, string]> {

        return new Promise((resolve, reject) => {
            this.javaController.write(game);

            let compiles: boolean;
            let compilableSection: string;

            const errorHandler = (data: any) => {
                console.log('FAILED: ' + data.toString());
                reject([]);
            };

            this.javaController.read(text => compiles = parseInt(text) == 1, errorHandler);
            this.javaController.read(text => compilableSection = text, errorHandler);
        });
    }
}

export class LudiiEvaluater {
    private javaController = new JavaController('approaches.symbolic.api.Evaluate');

    public evaluate(game: string): Promise<number> {

        return new Promise((resolve, reject) => {
            this.javaController.write(game);

            const errorHandler = (data: any) => {
                console.log('FAILED: ' + data.toString());
                reject([]);
            };

            this.javaController.read(text => resolve(parseFloat(text)), errorHandler);
        });
    }
}


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
    activeControllers.forEach(controller => controller.dispose())
}
