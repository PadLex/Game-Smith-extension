import { Completion, PartialCompiler, LegacyCompiler, Compiler } from "./compiler";
const https = require('https');
import * as vscode from 'vscode';


export class CodeProvider {
    public inferenceURL: URL|null = null;

    private legacyCompiler;
    private partialCompiler;
    public compiler: Compiler;

    public constructor(extensionUri: vscode.Uri) {
        this.legacyCompiler = new LegacyCompiler(extensionUri);
        this.partialCompiler = new PartialCompiler(extensionUri);
        this.compiler = this.legacyCompiler;
    }

    public async streamCompletions(english: string, ludii: string, completionHandler: (completions: Completion[]) => void, interrupted: () => boolean): Promise<void> {
        console.log("Stream English:", english);
        console.log("Stream Ludii:", ludii);
        console.log("Interrupted: ", interrupted());
        if (interrupted()) return;
        
        let completions = await this.findCompletions(english, ludii);
        completionHandler(completions);

        let complete: Completion[] = [];
        while (!interrupted()) {
            const bestBroken = completions.find(c => !complete.includes(c) && !c.compiles);
            if (bestBroken == undefined) break;

            const nextCompletions = await this.findCompletions(english, ludii + bestBroken.value);
            if (nextCompletions.length == 0) {
                complete.push(bestBroken);
                continue;
            }
            
            completions = completions.filter(c => c != bestBroken);
            completions.push(...nextCompletions.map(c => {
                return {compiles: c.compiles, score: c.score, value: bestBroken.value + c.value}
            }));
            completions.sort((a, b) => b.score != a.score? b.score - a.score : b.value.length - a.value.length);
            completionHandler(completions);
        }

    }

    private async findCompletions(english: string, ludii: string): Promise<Completion[]> {
        const inferences = await this.infer("Construct a Ludii game based on the following description", english, legacy_compact(ludii));
        
        let completions: Completion[] = [];
        for (let continuation of inferences) {
            const completion = await this.compiler.compile(ludii + " " + continuation);
            completion.value = completion.value.substring(ludii.length);

            if (completion.value.length > 0 && completions.find(c => c.value == completion.value) == undefined)
                completions.push(completion);
        }

        completions.sort((a, b) => b.score != a.score? b.score - a.score : b.value.length - a.value.length);
        return completions;
    }

    private async infer(instruction: string, input: string, partial: string): Promise<string[]> {
        if (this.inferenceURL == null)
            await this.requestInferenceURL();
        
        const url = this.inferenceURL as URL;
        url.searchParams.append('instruction', instruction);
        url.searchParams.append('input', input);
        url.searchParams.append('partial', partial);
        url.searchParams.append('temperature', "0.5");
        url.searchParams.append('max_new_tokens', "50");
        url.searchParams.append('n', "4");

        console.log("Inference URL:", url.href)

        let good = false;
    
        return new Promise((resolve, reject) => {
            const request = https.get(url.href, (res: any) => {
                let data = '';
    
                // A chunk of data has been received.
                res.on('data', (chunk: Buffer) => {
                    data += chunk;
                    if (!data.includes("ERR_NGROK")) {
                        good = true;
                    }
                });
    
                // The whole response has been received.
                res.on('end', () => {
                    resolve(JSON.parse(data).completions);
                });
            });
            
            request.on("error", async (err: Error) => {
                console.log("Error: " + err.message);
                await this.badURL();
                resolve([]);
            });

            setTimeout(() => {
                console.log("time " + good);
                if (!good) {
                    console.log("Timeout");
                    request.abort();
                    this.badURL();
                    resolve([]);
                }
            }, 5000);
        });
    }

    async requestInferenceURL(): Promise<void> {
        while (this.inferenceURL == null) {
            try {
                this.inferenceURL = new URL(await vscode.window.showInputBox({
                    placeHolder: "Inference URL",
                    prompt: "Follow the instruction from the Colab notebook to obtain an inference URL.",
                }) || "");
            } catch (e) {
                await this.badURL();
            }
        }
        
    }

    async badURL(): Promise<void> {
        this.inferenceURL = null;
        await vscode.window.showErrorMessage("Invalid inference URL. Please try again.");
    }

    public useLegacyCompiler(): void {
        this.compiler = this.legacyCompiler;
    }

    public usePartialCompiler(): void {
        this.compiler = this.partialCompiler;
    }
}

// This is just to match the dataset's formatting. Probably should be updated to match the compiler's formatting.
function legacy_compact(rawLudii: string): string {
    return rawLudii.replace(/\s+/g, ' ').replace(/ \)/g, ')').replace(/ \}/g, '}')
}

// This is how I'll change it after the dataset is updated.
export function compact(rawLudii: string): string {
    return rawLudii.replace(/\s+/g, ' ').replace(/ \)/g, ')').replace(/ \}/g, '}').replace(/\( /g, '(').replace(/\{ /g, '{');
}