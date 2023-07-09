"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LudiiCompiler = exports.LudiiPredictionProvider = void 0;
const vscode = require("vscode");
const https = require('https');
const javaController_1 = require("./javaController");
const utils_1 = require("./utils");
class LudiiPredictionProvider {
    constructor() {
        this.compiler = new LudiiCompiler();
    }
    provideInlineCompletionItems(document, position, context, token) {
        return new Promise((resolve, reject) => {
            console.log(context.triggerKind);
            if (context.triggerKind == 1)
                return resolve([]);
            const game = (0, utils_1.getGame)(document.getText());
            console.log("PROVIDING INLINE COMPLETION ITEMS", game);
            const comments = (0, utils_1.getComments)(document.getText());
            console.log("COMMENTS: ", comments);
            this.infer("Construct a Ludii game based on the following description", comments, game).then(async (completions) => {
                let compiled = [];
                for (let completion of completions) {
                    console.log("PREDICTION: ", completion);
                    compiled.push({ "partial": game + completion, "score": completion.length });
                    //compiled.push(await this.compiler.compile(game + completion));
                    console.log("COMPILED: ", compiled[compiled.length - 1]);
                }
                compiled.sort((a, b) => b.score - a.score);
                resolve(compiled.map(compiled => new vscode.InlineCompletionItem(compiled.partial.substring(game.length))));
            }).catch((error) => {
                console.log(error);
                reject([]);
            });
        });
    }
    async infer(instruction, input, partial) {
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
class LudiiCompiler {
    constructor() {
        this.javaController = new javaController_1.JavaController('approaches.symbolic.api.Compile');
    }
    compile(game) {
        return new Promise(async (resolve, reject) => {
            this.javaController.write(game);
            let compiles;
            let score;
            let compilableSection;
            const errorHandler = (data) => {
                console.log('FAILED: ' + data.toString());
                reject([]);
            };
            compiles = parseInt(await this.javaController.read()) == 1;
            score = parseFloat(await this.javaController.read());
            compilableSection = await this.javaController.read();
            resolve({ compiles: compiles, score: score, partial: compilableSection });
        });
    }
}
exports.LudiiCompiler = LudiiCompiler;
//# sourceMappingURL=inlinePredict.js.map