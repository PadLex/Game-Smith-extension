"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeCompletionProvider = exports.LudiiCompiler = exports.LLMCompletionProvider = void 0;
const https = require('https');
const javaController_1 = require("./javaController");
class LLMCompletionProvider {
    constructor() {
        this.compiler = new LudiiCompiler();
    }
    async findCompletions(english, ludii, completionHandler) {
        console.log("English: ", english);
        console.log("Ludii: ", ludii);
        const inferences = await this.infer("Construct a Ludii game based on the following description", english, ludii);
        let completions = [];
        for (let completion of inferences) {
            console.log("PREDICTION: ", completion);
            completions.push({ value: completion, score: completion.length, compiles: false });
            //compiled.push(await this.compiler.compile(game + completion));
            console.log("COMPILED: ", completions[completions.length - 1]);
        }
        completions.sort((a, b) => b.score - a.score);
        completionHandler(completions);
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
exports.LLMCompletionProvider = LLMCompletionProvider;
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
class FakeCompletionProvider {
    async findCompletions(english, ludii, completionHandler) {
        console.log("English: ", english);
        console.log("Ludii: ", ludii);
        let completions = [
            { value: " hello world", score: 0, compiles: false },
            { value: " sure sure sure", score: 0, compiles: false },
            { value: " YUP", score: 0.1, compiles: true }
        ];
        completions.sort((a, b) => b.score - a.score);
        completionHandler(completions);
    }
}
exports.FakeCompletionProvider = FakeCompletionProvider;
//# sourceMappingURL=llmCompletionProvider.js.map