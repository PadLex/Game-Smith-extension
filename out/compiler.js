"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyCompiler = exports.PartialCompiler = void 0;
const javaController_1 = require("./javaController");
class PartialCompiler {
    javaController = new javaController_1.JavaController('approaches.symbolic.api.PartialCompile');
    async compile(ludii) {
        // console.log("\nCompiling: ", ludii);
        this.javaController.write(ludii);
        let compiles;
        let score;
        let compilableSection;
        compiles = parseInt(await this.javaController.read()) == 1;
        score = parseFloat(await this.javaController.read());
        compilableSection = await this.javaController.read();
        // console.log("Compiles: ", compiles);
        // console.log("Score: ", score);
        // console.log("Compilable section: ", compilableSection);
        return { compiles: compiles, score: score, value: compilableSection };
    }
}
exports.PartialCompiler = PartialCompiler;
class LegacyCompiler {
    javaController = new javaController_1.JavaController('approaches.symbolic.api.LegacyCompile');
    async compile(ludii) {
        // console.log("\nCompiling: ", ludii);
        this.javaController.write(ludii);
        let compiles;
        let score;
        compiles = (await this.javaController.read()).trim() == "1";
        score = parseFloat(await this.javaController.read()) || 0;
        this.javaController.clearQueue();
        console.log("Compiles: ", compiles);
        console.log("Score: ", score);
        if (!compiles)
            ludii = ludii.substring(0, ludii.lastIndexOf(" "));
        ludii = ludii.replaceAll("</s>", "");
        return { compiles: compiles, score: score, value: ludii };
    }
}
exports.LegacyCompiler = LegacyCompiler;
//# sourceMappingURL=compiler.js.map