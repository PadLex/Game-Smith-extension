const https = require('https');
import { JavaController } from './javaController';

export type Completion = {value: string, score: number, compiles: boolean};

export class LLMCompletionProvider {

    private compiler = new LudiiCompiler();

    public async findCompletions(english: string, ludii: string, completionHandler: (completions: Completion[]) => void): Promise<void> {
        console.log("English: ", english);
        console.log("Ludii: ", ludii);
        
        const inferences = await this.infer("Construct a Ludii game based on the following description", english, ludii);
        let completions = [];
        for (let completion of inferences) {
            console.log("PREDICTION: ", completion);
            completions.push({value: completion, score: completion.length, compiles: false});
            //compiled.push(await this.compiler.compile(game + completion));
            console.log("COMPILED: ", completions[completions.length - 1]);
        }

        completions.sort((a, b) => b.score - a.score);             
        completionHandler(completions);
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

export class FakeCompletionProvider {
    async findCompletions(english: string, ludii: string, completionHandler: (completions: Completion[]) => void): Promise<void> {
        console.log("English: ", english);
        console.log("Ludii: ", ludii);
        
        let completions = [
            {value: " hello world", score: 0, compiles: false},
            {value: " sure sure sure", score: 0, compiles: false},
            {value: " YUP", score: 0.1, compiles: true}
        ];

        completions.sort((a, b) => b.score - a.score);             
        completionHandler(completions);
    }
}