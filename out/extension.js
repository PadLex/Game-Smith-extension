"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.LudiiEvaluater = exports.LudiiCompiler = exports.LudiiAutocomplete = exports.JavaController = exports.LudiiPredictionProvider = void 0;
const vscode = require("vscode");
const child_process_1 = require("child_process");
const https = require('https');
class LudiiPredictionProvider {
    provideInlineCompletionItems(document, position, context, token) {
        return new Promise((resolve, reject) => {
            console.log(context.triggerKind);
            if (context.triggerKind == 1)
                return resolve([]);
            const game = getGame(document.getText());
            console.log("PROVIDING INLINE COMPLETION ITEMS", game);
            const comments = getComments(document.getText());
            console.log("COMMENTS: ", comments);
            this.infer("Construct a Ludii game based on the following description", comments, game).then((completions) => {
                console.log("PREDICTIONS: ", completions);
                resolve(completions.map(completion => new vscode.InlineCompletionItem(completion)));
            }).catch((error) => {
                console.log(error);
                reject([]);
            });
        });
    }
    async infer(instruction, input, partial) {
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
            https.get(url.href, (res) => {
                let data = '';
                // A chunk of data has been received.
                res.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received.
                res.on('end', () => {
                    resolve(JSON.parse(data).completions);
                });
            }).on("error", (err) => {
                console.log("Error: " + err.message);
                reject(err);
            });
        });
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
let activeControllers = [];
class JavaController {
    constructor(javaClass) {
        this.keepAlive = true;
        this.lock = false;
        this.javaProcess = this.spawnJavaProcess(javaClass);
        activeControllers.push(this);
    }
    write(text) {
        console.log('\nPROVIDING:', text);
        if (this.lock)
            throw "Can not write bacause the previous read operation is ongoing."; //TODO check if lock is necessary
        this.javaProcess.stdin.write(text + '\n');
    }
    read(dataHandler, errorHandler) {
        this.lock = true;
        let result = '';
        this.javaProcess.stdout.on('data', (data) => {
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
        this.javaProcess.stderr.on('error', (data) => {
            this.lock = false;
            // Clen-up
            this.javaProcess.stdout.removeListener('data', dataHandler);
            this.javaProcess.stderr.removeListener('error', errorHandler);
            errorHandler(data);
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
exports.JavaController = JavaController;
class LudiiAutocomplete {
    constructor() {
        this.javaController = new JavaController('approaches.symbolic.api.Autocomplete');
    }
    provideCompletionItems(document, position, token, context) {
        return new Promise((resolve, reject) => {
            let completionItems = [];
            let docText = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
            this.javaController.write(getGame(docText));
            const dataHandler = (text) => {
                text = text.substring(0, text.length - 2);
                const completions = text.split('||');
                completions.forEach((completion) => {
                    const [label, detail] = completion.split('|');
                    console.log(completion, "->", label, "&", detail);
                    const item = new vscode.CompletionItem(label);
                    item.detail = detail;
                    completionItems.push(item);
                });
                resolve(completionItems);
            };
            const errorHandler = (data) => {
                console.log('FAILED: ' + data.toString());
                reject([]);
            };
            this.javaController.read(dataHandler, errorHandler);
        });
    }
}
exports.LudiiAutocomplete = LudiiAutocomplete;
class LudiiCompiler {
    constructor() {
        this.javaController = new JavaController('approaches.symbolic.api.Compile');
    }
    compile(game) {
        return new Promise((resolve, reject) => {
            this.javaController.write(game);
            let compiles;
            let compilableSection;
            const errorHandler = (data) => {
                console.log('FAILED: ' + data.toString());
                reject([]);
            };
            this.javaController.read(text => compiles = parseInt(text) == 1, errorHandler);
            this.javaController.read(text => compilableSection = text, errorHandler);
        });
    }
}
exports.LudiiCompiler = LudiiCompiler;
class LudiiEvaluater {
    constructor() {
        this.javaController = new JavaController('approaches.symbolic.api.Evaluate');
    }
    evaluate(game) {
        return new Promise((resolve, reject) => {
            this.javaController.write(game);
            const errorHandler = (data) => {
                console.log('FAILED: ' + data.toString());
                reject([]);
            };
            this.javaController.read(text => resolve(parseFloat(text)), errorHandler);
        });
    }
}
exports.LudiiEvaluater = LudiiEvaluater;
const ludiiCompletionItemProvider = new LudiiAutocomplete();
const ludiiPredictionProvider = new LudiiPredictionProvider();
function activate(context) {
    console.log('Ludii started');
    // context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
    //     { language: 'ludii', scheme: 'file' },
    //     ludiiCompletionItemProvider
    // ));
    context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider({ language: 'ludii', scheme: 'file' }, ludiiPredictionProvider));
}
exports.activate = activate;
function deactivate() {
    activeControllers.forEach(controller => controller.dispose());
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map