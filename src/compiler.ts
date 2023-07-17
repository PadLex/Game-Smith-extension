import { JavaController } from './javaController';
export type Completion = {value: string, score: number, compiles: boolean};

export interface Compiler {
    compile(ludii: string): Promise<Completion>;
}

export class PartialCompiler implements Compiler {
    private javaController = new JavaController('approaches.symbolic.api.PartialCompile');

    public async compile(ludii: string): Promise<Completion> {
        // console.log("\nCompiling: ", ludii);
        
        this.javaController.write(ludii);

        let compiles: boolean;
        let score: number;
        let compilableSection: string;

        compiles = parseInt(await this.javaController.read()) == 1;
        score = parseFloat(await this.javaController.read());
        compilableSection = await this.javaController.read();

        // console.log("Compiles: ", compiles);
        // console.log("Score: ", score);
        // console.log("Compilable section: ", compilableSection);

        return {compiles: compiles, score: score, value: compilableSection};
        
    }
}

export class LegacyCompiler implements Compiler {
    private javaController = new JavaController('approaches.symbolic.api.LegacyCompile');

    public async compile(ludii: string): Promise<Completion> {
        // console.log("\nCompiling: ", ludii);
        
        this.javaController.write(ludii);

        let compiles: boolean;
        let score: number;

        compiles = (await this.javaController.read()).trim() == "1";
        score = parseFloat(await this.javaController.read()) || 0;
        this.javaController.clearQueue();

        console.log("Compiles: ", compiles);
        console.log("Score: ", score);
        
        if (!compiles)
            ludii = ludii.substring(0, ludii.lastIndexOf(" "));
            
        ludii = ludii.replaceAll("</s>", "");

        return {compiles: compiles, score: score, value: ludii};
        
    }
}