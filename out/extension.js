"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.LudiiCompletionItemProvider = void 0;
const vscode = require("vscode");
const child_process_1 = require("child_process");
const events_1 = require("events");
class LudiiCompletionItemProvider {
    constructor() {
        this.keepAlive = true;
        [this.javaProcess, this.responseEmitter] = this.spawnJavaProcess();
    }
    provideCompletionItems(document, position, token, context) {
        return new Promise((resolve, reject) => {
            let completionItems = [];
            console.log('\nPROVIDING:', document.getText().replace('\n', ' '));
            this.javaProcess.stdin.write(document.getText().replace('\n', ' ') + '\n');
            let result = '';
            const dataHandler = (data) => {
                console.log('PARTIAL: ', data.at(data.length - 1));
                const dataString = data.toString();
                result += dataString;
                if (dataString.endsWith('||\n')) {
                    result = result.substring(0, result.length - 3);
                    console.log('SUCCESS: ' + result);
                    const completions = result.split('||');
                    completions.forEach((completion) => {
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
            const errorHandler = (data) => {
                console.log('FAILED: ' + data.toString());
                this.javaProcess.stdout.removeListener('data', dataHandler);
                this.javaProcess.stderr.removeListener('error', errorHandler);
                reject([]);
            };
            this.javaProcess.stdout.on('data', dataHandler);
            this.javaProcess.stderr.on('error', errorHandler);
        });
    }
    spawnJavaProcess() {
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
        const javaProcess = (0, child_process_1.spawn)('java', ['-cp', javaPath, javaClass]);
        const responseEmitter = new events_1.EventEmitter();
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
    dispose() {
        this.keepAlive = false;
        this.javaProcess.kill();
    }
}
exports.LudiiCompletionItemProvider = LudiiCompletionItemProvider;
const ludiiCompletionItemProvider = new LudiiCompletionItemProvider();
function activate(context) {
    console.log('Ludii started');
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ language: 'ludii', scheme: 'file' }, ludiiCompletionItemProvider, ' ', '\t', '\n', '\r', '(', ')', '{', '}', ':', 'h'));
}
exports.activate = activate;
function deactivate() {
    ludiiCompletionItemProvider.dispose();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map