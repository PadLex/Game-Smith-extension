import * as vscode from 'vscode';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
//import { client } from "@gradio/client";

class testClient {
    public async predict(endpoint: string, args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve([
                {
                    "value": "(game \"Hex\" (players 2) (equipment { (board (hex Diamond 11)) (piece \"Marker\" Each) (regions P1 {(sites Side NE) (sites Side SW)}) (regions P2 {(sites Side NW) (sites Side SE)})}) (rules (meta (swap)) (play (move Add (to (sites Empty)))) (end (if (is Connected Mover) (result Mover Win)))))"
                }
            ]);
        });
    }
}


export class LudiiPredictionProvider implements vscode.InlineCompletionItemProvider {
    private gradioClient: any;
    private model = "earthshine-nondecorative-2023-06-27-17-40-07";
    private template = "alpaca";

    constructor() {
        //client("https://7d55bed0b056f62d56.gradio.live/").then(gradioClient => this.gradioClient = gradioClient);
        this.gradioClient = new testClient();
    }

    public provideInlineCompletionItems(
        document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.InlineCompletionItem[]> {
        return new Promise((resolve, reject) => {
            const game = getGame(document.getText());
            console.log("PROVIDING INLINE COMPLETION ITEMS", game);

            if (game.length == 0) {
                const comments = getComments(document.getText());
                console.log("COMMENTS: ", comments);
                this.infer("Construct a Ludii game based on the following description", comments).then((prediction: string) => {
                    console.log("PREDICTION: ", prediction);
                    const completion = new vscode.InlineCompletionItem(prediction);
                    resolve([completion]);
                }).catch((error: any) => {
                    console.log(error);
                    reject([]);
                });
            }
            
        });
    }

    public async infer(instruction: string, input: string): Promise<string> {
        const result = await this.gradioClient.predict(
            "/inference", 
            [
                this.model,	// str representing Option from: [] in 'LoRA Model' Dropdown component
                this.template,	// str representing Option from: [] in 'Prompt Template' Dropdown component
                instruction,	// str representing string value in 'Prompt' Textbox component
                input,	// str representing string value in '' Textbox component
                "",	// str representing string value in '' Textbox component
                "",	// str representing string value in '' Textbox component
                "",	// str representing string value in '' Textbox component
                "",	// str representing string value in '' Textbox component
                "",	// str representing string value in '' Textbox component
                "",	// str representing string value in '' Textbox component
                0,	// int | float representing numeric value between 0 and 2 in 'Temperature' Slider component
                0.75,	// int | float representing numeric value between 0 and 1 in 'Top P' Slider component
                40,	// int | float representing numeric value between 0 and 100 in 'Top K' Slider component
                2,	// int | float representing numeric value between 1 and 5 in 'Beams' Slider component
                1.2,	// int | float representing numeric value between 0 and 2.5 in 'Repetition Penalty' Slider component
                10,	// int | float representing numeric value between 0 and 4096 in 'Max New Tokens' Slider component
                false,	// bool representing boolean value in 'Stream Output' Checkbox component
                false	// bool representing boolean value in 'Show Raw' Checkbox component
            ]
        );

        return result[0]['value'];
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


export class LudiiCompletionItemProvider implements vscode.CompletionItemProvider {
    private javaProcess: ChildProcessWithoutNullStreams;
    private keepAlive: boolean = true;


    constructor() {
        this.javaProcess = this.spawnJavaProcess('approaches.symbolic.api.Autocomplete');
    }

    public provideCompletionItems(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext
    ): Thenable<vscode.CompletionItem[]> {

        return new Promise((resolve, reject) => {
            let completionItems: vscode.CompletionItem[] = [];

            let docText = document.getText(new vscode.Range(new vscode.Position(0, 0), position));

            const text = getGame(docText);
            console.log('\nPROVIDING:', text);

            this.javaProcess.stdin.write(text + '\n');
            
            let result = '';
            const dataHandler = (data: Buffer) => {
                console.log('PARTIAL: ', data.at(data.length - 1));
                const dataString = data.toString();
                result += dataString;
                if (dataString.endsWith('||\n')) {
                    result = result.substring(0, result.length - 3);
                    console.log('SUCCESS: ' + result);
                    const completions = result.split('||');
                    
                    completions.forEach((completion: string) => {
                        const [label, detail] = completion.split('|');
                        console.log(completion, "->", label, "&", detail);
                        const item = new vscode.CompletionItem(label);
                        item.detail = detail;
                        completionItems.push(item);
                    });

                    this.javaProcess.stdout.removeListener('data', dataHandler);
                    this.javaProcess.stderr.removeListener('error', errorHandler);
                    resolve(completionItems);
                }
            };

            const errorHandler = (data: any) => {
                console.log('FAILED: ' + data.toString());
                this.javaProcess.stdout.removeListener('data', dataHandler);
                this.javaProcess.stderr.removeListener('error', errorHandler);
                reject([]);
            };

            this.javaProcess.stdout.on('data', dataHandler);
            this.javaProcess.stderr.on('error', errorHandler);
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


const ludiiCompletionItemProvider = new LudiiCompletionItemProvider();
const ludiiPredictionProvider = new LudiiPredictionProvider();

export function activate(context: vscode.ExtensionContext) {
    console.log('Ludii started');


    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
        { language: 'ludii', scheme: 'file' },
        ludiiCompletionItemProvider
    ));

    context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider(
        { language: 'ludii', scheme: 'file' },
        ludiiPredictionProvider
    ));
}

export function deactivate() {
    ludiiCompletionItemProvider.dispose();
}
