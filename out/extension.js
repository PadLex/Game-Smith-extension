"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.LudiiCompletionItemProvider = exports.LudiiPredictionProvider = void 0;
const vscode = require("vscode");
const child_process_1 = require("child_process");
//import { client } from "@gradio/client";
class testClient {
    async predict(endpoint, args) {
        return new Promise((resolve, reject) => {
            resolve([
                {
                    "value": "(game \"Hex\" (players 2) (equipment { (board (hex Diamond 11)) (piece \"Marker\" Each) (regions P1 {(sites Side NE) (sites Side SW)}) (regions P2 {(sites Side NW) (sites Side SE)})}) (rules (meta (swap)) (play (move Add (to (sites Empty)))) (end (if (is Connected Mover) (result Mover Win)))))"
                }
            ]);
        });
    }
}
class LudiiPredictionProvider {
    constructor() {
        this.model = "earthshine-nondecorative-2023-06-27-17-40-07";
        this.template = "alpaca";
        //client("https://7d55bed0b056f62d56.gradio.live/").then(gradioClient => this.gradioClient = gradioClient);
        this.gradioClient = new testClient();
    }
    provideInlineCompletionItems(document, position, context, token) {
        return new Promise((resolve, reject) => {
            const game = getGame(document.getText());
            console.log("PROVIDING INLINE COMPLETION ITEMS", game);
            if (game.length == 0) {
                const comments = getComments(document.getText());
                console.log("COMMENTS: ", comments);
                this.infer("Construct a Ludii game based on the following description", comments).then((prediction) => {
                    console.log("PREDICTION: ", prediction);
                    const completion = new vscode.InlineCompletionItem(prediction);
                    resolve([completion]);
                }).catch((error) => {
                    console.log(error);
                    reject([]);
                });
            }
        });
    }
    async infer(instruction, input) {
        const result = await this.gradioClient.predict("/inference", [
            this.model,
            this.template,
            instruction,
            input,
            "",
            "",
            "",
            "",
            "",
            "",
            0,
            0.75,
            40,
            2,
            1.2,
            10,
            false,
            false // bool representing boolean value in 'Show Raw' Checkbox component
        ]);
        return result[0]['value'];
    }
    dispose() {
        // TODO
    }
}
exports.LudiiPredictionProvider = LudiiPredictionProvider;
function getGame(text) {
    text = text.replace(/(^|\n)\s*\/\/.*?($|\n)/g, '\n'); // Remove comments
    text = text.replace(/\n/g, ' '); // Remove newlines
    text = text.trim();
    return text;
}
function getComments(text) {
    let commentLines = text.match(/(^|\n)\s*\/\/.*?($|\n)/g);
    let commentContents = "";
    if (commentLines) {
        commentContents += commentLines.map(line => line.replace(/(^|\n)\s*\/\/\s?/, '').trim()) + ' ';
    }
    return commentContents;
}
class LudiiCompletionItemProvider {
    constructor() {
        this.keepAlive = true;
        this.javaProcess = this.spawnJavaProcess('approaches.symbolic.api.Autocomplete');
    }
    provideCompletionItems(document, position, token, context) {
        return new Promise((resolve, reject) => {
            let completionItems = [];
            let docText = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
            const text = getGame(docText);
            console.log('\nPROVIDING:', text);
            this.javaProcess.stdin.write(text + '\n');
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
    spawnJavaProcess(javaClass) {
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
        javaProcess.on('exit', () => {
            if (this.keepAlive) {
                console.log('Java process exited. Restarting...');
                this.javaProcess = this.spawnJavaProcess(javaClass);
            }
        });
        javaProcess.stdout.once('data', data => console.log('Startup:', data.toString()));
        return javaProcess;
    }
    dispose() {
        this.keepAlive = false;
        this.javaProcess.kill();
    }
}
exports.LudiiCompletionItemProvider = LudiiCompletionItemProvider;
const ludiiCompletionItemProvider = new LudiiCompletionItemProvider();
const ludiiPredictionProvider = new LudiiPredictionProvider();
function activate(context) {
    console.log('Ludii started');
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ language: 'ludii', scheme: 'file' }, ludiiCompletionItemProvider));
    context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider({ language: 'ludii', scheme: 'file' }, ludiiPredictionProvider));
}
exports.activate = activate;
function deactivate() {
    ludiiCompletionItemProvider.dispose();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map