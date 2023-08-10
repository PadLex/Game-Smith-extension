import { JavaController } from './javaController';
import * as vscode from 'vscode';

export type Completion = {value: string, score: number, compiles: boolean};

export interface Compiler {
    compile(ludii: string): Promise<Completion>;
}

export class PartialCompiler implements Compiler {

    private javaController;

    public constructor(private extensionUri: vscode.Uri) {
        this.javaController = new JavaController('approaches.symbolic.api.FractionalCompilerEndpoint', extensionUri);
    }

    public async compile(ludii: string): Promise<Completion> {
        // console.log("\nCompiling: ", ludii);
        
        this.javaController.write(ludii);

        let compiles: boolean;
        let score: number;
        let compilableSection: string;

        const response = (await this.javaController.read()).split('|');
        compiles = parseInt(response[0]) == 1;
        score = parseFloat(response[1]);
        compilableSection = response[2];

        // console.log("Compiles: ", compiles);
        // console.log("Score: ", score);
        // console.log("Compilable section: ", compilableSection);

        return {compiles: compiles, score: score, value: compilableSection};
        
    }
}

export class LegacyCompiler implements Compiler {
    private javaController;

    public constructor(private extensionUri: vscode.Uri) {
        this.javaController = new JavaController('approaches.symbolic.api.LegacyCompilerEndpoint', extensionUri);
    }

    public async compile(ludii: string): Promise<Completion> {
        // console.log("\nCompiling: ", ludii);
        
        this.javaController.write(ludii);

        let compiles: boolean;
        let score: number;

        const response = (await this.javaController.read()).split('|');
        compiles = response[0].trim() == "1";
        score = compiles? parseFloat(response[1]) || 0 : 0;
        this.javaController.clearQueue();

        console.log("Compiles: ", compiles);
        console.log("Score: ", score);
        
        if (!compiles)
            ludii = ludii.substring(0, ludii.lastIndexOf(" "));
            
        ludii = ludii.replaceAll("</s>", "");

        return {compiles: compiles, score: score, value: ludii};
        
    }
}