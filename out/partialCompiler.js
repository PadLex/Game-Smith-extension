"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialCompiler = void 0;
const javaController_1 = require("./javaController");
class PartialCompiler {
    javaController = new javaController_1.JavaController('approaches.symbolic.api.Compile');
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
//# sourceMappingURL=partialCompiler.js.map