import { publicDecrypt } from "crypto";
import { Completion, LudiiCompiler } from "./compiler";
const https = require('https');

export class LLMCompletionProvider {

    private compiler = new LudiiCompiler();

    public async streamCompletions(english: string, ludii: string, completionHandler: (completions: Completion[]) => void, interrupted: () => boolean): Promise<void> {
        // console.log("English: ", english);
        // console.log("Ludii: ", ludii);
        if (interrupted()) return;
        
        let completions = await this.findCompletions(english, ludii);
        completionHandler(completions);

        while (!interrupted()) {
            const bestBroken = completions.find(c => !c.compiles);
            if (bestBroken == undefined) break;
            const nextCompletions = await this.findCompletions(english, ludii + bestBroken.value);
            if (nextCompletions.length == 0) break;
            completions = completions.filter(c => c != bestBroken);
            completions.push(...nextCompletions.map(c => {return {compiles: c.compiles, score: c.score, value: bestBroken.value + c.value}}));
            completions.sort((a, b) => b.score - a.score);
            completionHandler(completions);
        }
    }

    private async findCompletions(english: string, ludii: string): Promise<Completion[]> {
        const inferences = await fake_infer("Construct a Ludii game based on the following description", english, compact(ludii));
        
        let completions: Completion[] = [];
        for (let continuation of inferences) {
            // console.log("PREDICTION: ", continuation);
            const completion = await this.compiler.compile(ludii + continuation);
            completion.value = completion.value.substring(ludii.length);
            // console.log("COMPILED: ", completion);

            if (completion.value.length > 0 && completions.find(c => c.value == completion.value) == undefined)
                completions.push(completion);
        }

        completions.sort((a, b) => b.score - a.score);  
        return completions;
    }

    public dispose() {
        // TODO
    }
}



async function infer(instruction: string, input: string, partial: string): Promise<string[]> {
    const url = new URL('https://762a-34-125-86-78.ngrok.io');

    url.searchParams.append('instruction', instruction);
    url.searchParams.append('input', input);
    url.searchParams.append('partial', partial);
    url.searchParams.append('temperature', "0.5");
    url.searchParams.append('max_new_tokens', "100");
    url.searchParams.append('n', "5");

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
            reject(err);
        });
    });
}

async function fake_infer(instruction: string, input: string, partial: string): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const fakes = [
        "(game \"Hex\" (players 2) (equipment { (board (hex Diamond 11)) (piece \"Marker\" Each) (regions P1 {(sites Side NE) (sites Side SW)}) (regions P2 {(sites Side NW) (sites Side SE)})}) (rules (meta (swap)) (play (move Add (to (sites Empty)))) (end (if (is Connected Mover) (result Mover Win)))))",
        "(game \"Hex\" (players 2) (equipment { (board (hex Diamond 11)) (piece \"Marker\" Each)}) (rules (meta (swap)) (play (move Add (to (sites Empty)))) (end (if (is Connected Mover) (result Mover Win)))))",
        "(game \"Hex\" (players 2) (equipment { (board (hex Diamond 11)) (piece \"Marker\" Each) (regions P1 {(sites Side NE) (sites Side SW)}) (regions P2 {(sites Side NW) (sites Side SE)})}) (rules (meta (swap)) (play (move Add (to (sites Fulll)))) (end (if (is Connected Mover) (result Mover Win)))))",
        "(game \"Hex\" (players 2) (equipment { (board (hex Diamond 11)) (piece \"Marker\" Each) (regions P1 {(sites Side NE) (sites Side SW)}) (regions P2 {(sites Side NW) (sites Side SE)})}) (rules (play (move Add (to (sites Empty)))) (end (if (is Connected Mover) (result Mover Win)))))",
    ]
    // console.log("real:", partial)
    // console.log("fake:", fakes[0])
    return fakes.map(f => f.substring(partial.length, partial.length+50));
}


// This is just to match the dataset's formatting. Probably should be updated to match the compiler's formatting.
function compact(rawLudii: string): string {
    return rawLudii.replace(/\s+/g, ' ').replace(/ \)/g, ')').replace(/ \}/g, '}')
}
