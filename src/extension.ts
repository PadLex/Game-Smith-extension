import * as vscode from 'vscode';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { EventEmitter } from 'events';


export class LudiiCompletionItemProvider implements vscode.CompletionItemProvider {
    private javaProcess: ChildProcessWithoutNullStreams;
    private responseEmitter: EventEmitter;
    private keepAlive: boolean = true;


    constructor() {
        [this.javaProcess, this.responseEmitter] = this.spawnJavaProcess();
    }

    public provideCompletionItems(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext
    ): Thenable<vscode.CompletionItem[]> {

        return new Promise((resolve, reject) => {
            let completionItems: vscode.CompletionItem[] = [];
            
            console.log('\nPROVIDING:', document.getText().replace('\n', ' '));
            this.javaProcess.stdin.write(document.getText().replace('\n', ' ') + '\n');
            
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

    public spawnJavaProcess(): [ChildProcessWithoutNullStreams, EventEmitter] {
        const javaClass = 'approaches.symbolic.generators.DescriptionParser';
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
        const responseEmitter = new EventEmitter();

        // javaProcess.stdout.on('data', (data) => {
        //     responseEmitter.emit('data', data);
        // });

        // javaProcess.stderr.on('data', (data) => {
        //     responseEmitter.emit('error', data);
        // });

        javaProcess.on('exit', () => {
            if (this.keepAlive) {
                console.log('Java process exited. Restarting...');
                [this.javaProcess, this.responseEmitter] = this.spawnJavaProcess();
            }
        });

        javaProcess.stdout.once('data', data => console.log('Startup:', data.toString()));

        return [javaProcess, responseEmitter];
    }

    public dispose() {
        this.keepAlive = false;
        this.javaProcess.kill();
    }
}


const ludiiCompletionItemProvider = new LudiiCompletionItemProvider();

export function activate(context: vscode.ExtensionContext) {
    console.log('Ludii started');


    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
        { language: 'ludii', scheme: 'file' },
        ludiiCompletionItemProvider,
        ' ', '\t', '\n', '\r', '(', ')', '{', '}', ':', 'h'
    ));
}

export function deactivate() {
    ludiiCompletionItemProvider.dispose();
}
