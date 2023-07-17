import { Completion, PartialCompiler, LegacyCompiler, Compiler } from "./compiler";
const https = require('https');
import * as vscode from 'vscode';


export class CodeProvider {
    public inferenceURL: string = "";

    private legacyCompiler;
    private partialCompiler;
    public compiler: Compiler;

    public constructor(extensionUri: vscode.Uri) {
        this.legacyCompiler = new LegacyCompiler(extensionUri);
        this.partialCompiler = new PartialCompiler(extensionUri);
        this.compiler = this.legacyCompiler;
    }

    public async streamCompletions(english: string, ludii: string, completionHandler: (completions: Completion[]) => void, interrupted: () => boolean): Promise<void> {
        console.log("English: ", english);
        console.log("Ludii: ", ludii);
        console.log("Interrupted: ", interrupted());
        if (interrupted()) return;
        
        let completions = await this.findCompletions(english, ludii);
        completionHandler(completions);

        let complete: Completion[] = [];
        while (!interrupted()) {
            const bestBroken = completions.find(c => !complete.includes(c) && !c.compiles);
            if (bestBroken == undefined) break;

            const nextCompletions = await this.findCompletions(english, ludii + bestBroken.value);
            console.log("Next completions: ", nextCompletions);
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

        console.log("Final completions: ", completions);
    }

    private async findCompletions(english: string, ludii: string): Promise<Completion[]> {
        const inferences = await this.infer("Construct a Ludii game based on the following description", english, legacy_compact(ludii));

        console.log("INFERENCES: ", inferences);
        
        let completions: Completion[] = [];
        for (let continuation of inferences) {
            console.log("PREDICTION: ", continuation);
            const completion = await this.compiler.compile(ludii + " " + continuation);
            completion.value = completion.value.substring(ludii.length);
            console.log("COMPILED: ", completion);

            if (completion.value.length > 0 && completions.find(c => c.value == completion.value) == undefined)
                completions.push(completion);
        }

        completions.sort((a, b) => b.score != a.score? b.score - a.score : b.value.length - a.value.length);
        return completions;
    }

    private async infer(instruction: string, input: string, partial: string): Promise<string[]> {
        if (this.inferenceURL == "")
            await this.requestInferenceURL();

        const url = new URL(this.inferenceURL);
        url.searchParams.append('instruction', instruction);
        url.searchParams.append('input', input);
        url.searchParams.append('partial', partial);
        url.searchParams.append('temperature', "0.5");
        url.searchParams.append('max_new_tokens', "50");
        url.searchParams.append('n', "4");
    
        return new Promise((resolve, reject) => {
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
                this.badURL();
                reject(err);
            });
        });
    }

    async requestInferenceURL(): Promise<void> {
        this.inferenceURL = await vscode.window.showInputBox({
            placeHolder: "Inference URL",
            prompt: "Follow the instruction from the Colab notebook to obtain an inference URL.",
        }) || "";
    }

    async badURL(): Promise<void> {
        this.inferenceURL = "";
        await vscode.window.showErrorMessage("Invalid inference URL. Please try again.");
    }

    public useLegacyCompiler(): void {
        this.compiler = this.legacyCompiler;
    }

    public usePartialCompiler(): void {
        this.compiler = this.partialCompiler;
    }
}


async function fake_infer(instruction: string, input: string, partial: string): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const fakes = [
        "(game \"Hex\" (players 2) (equipment { (board (hex Diamond 11)) (piece \"Marker\" Each) (regions P1 {(sites Side NE) (sites Side SW)}) (regions P2 {(sites Side NW) (sites Side SE)})}) (rules (meta (swap)) (play (move Add (to (sites Empty)))) (end (if (is Connected Mover) (result Mover Win)))))",
        "(game \"Hex\" (players 2) (equipment { (board (hex Diamond 11)) (piece \"Marker\" Each)}) (rules (meta (swap)) (play (move Add (to (sites Empty)))) (end (if (is Connected Mover) (result Mover Win)))))",
        "(game \"Hex\" (players 2) (equipment { (board (hex Diamond 11)) (piece \"Marker\" Each) (regions P1 {(sites Side NE) (sites Side SW)}) (regions P2 {(sites Side NW) (sites Side SE)})}) (rules (meta (swap)) (play (move Add (to (sites Fulll)))) (end (if (is Connected Mover) (result Mover Win)))))",
        "(game \"Hex\" (players 2) (equipment { (board (hex Diamond 11)) (piece \"Marker\" Each) (regions P1 {(sites Side NE) (sites Side SW)}) (regions P2 {(sites Side NW) (sites Side SE)})}) (rules (play (move Add (to (sites Empty)))) (end (if (is Connected Mover) (result Mover Win)))))",
    ]
    // console.log("real:", partial)
    // console.log("fake:", fakes[0])
    partial = compact(partial);
    return fakes.map(f => compact(f).substring(partial.length, partial.length+50));
}

// This is just to match the dataset's formatting. Probably should be updated to match the compiler's formatting.
function legacy_compact(rawLudii: string): string {
    return rawLudii.replace(/\s+/g, ' ').replace(/ \)/g, ')').replace(/ \}/g, '}')
}

// This is how I'll change it after the dataset is updated.
export function compact(rawLudii: string): string {
    return rawLudii.replace(/\s+/g, ' ').replace(/ \)/g, ')').replace(/ \}/g, '}').replace(/\( /g, '(').replace(/\{ /g, '{');
}