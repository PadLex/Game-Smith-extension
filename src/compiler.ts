import { JavaController } from './javaController';
export type Completion = {value: string, score: number, compiles: boolean};

export class LudiiCompiler {
    private javaController = new JavaController('approaches.symbolic.api.Compile');

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