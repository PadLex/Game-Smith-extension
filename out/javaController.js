"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disposeControllers = exports.JavaController = void 0;
const child_process_1 = require("child_process");
let activeControllers = [];
class JavaController {
    constructor(javaClass) {
        this.keepAlive = true;
        this.lock = false;
        this.javaProcess = this.spawnJavaProcess(javaClass);
        activeControllers.push(this);
    }
    write(text) {
        console.log('\nPROVIDING:', text);
        if (this.lock)
            throw "Can not write bacause the previous read operation is ongoing."; //TODO check if lock is necessary
        this.javaProcess.stdin.write(text + '\n');
    }
    read() {
        return new Promise((resolve, reject) => {
            this.lock = true;
            let result = '';
            const dataHandler = (data) => {
                console.log('PARTIAL: ', data.toString());
                const dataString = data.toString();
                result += dataString;
                if (dataString.endsWith('\n')) { // TODO check if I broke something because it was '||\n'
                    console.log('SUCCESS: ' + dataString);
                    // Clen-up
                    this.javaProcess.stdout.removeListener('data', dataHandler);
                    this.javaProcess.stderr.removeListener('error', errorHandler);
                    this.lock = false;
                    resolve(result.substring(0, result.length - 1));
                }
            };
            const errorHandler = (error) => {
                // Clen-up
                this.javaProcess.stdout.removeListener('data', dataHandler);
                this.javaProcess.stderr.removeListener('error', errorHandler);
                this.lock = false;
                reject(error);
            };
            this.javaProcess.stdout.on('data', dataHandler);
            this.javaProcess.stderr.on('error', errorHandler);
        });
    }
    spawnJavaProcess(javaClass) {
        const projectRoot = '/Users/alex/Documents/Marble/Ludii/';
        const javaPath = [
            'Generation/bin',
            'Common/bin',
            'Common/lib/json-20180813.jar',
            'Common/lib/Trove4j_ApacheCommonsRNG.jar',
            'Core/bin',
            'Core/lib/jfreesvg-3.4.jar',
            'Language/bin'
        ].map(module => projectRoot + module).join(':');
        const javaProcess = (0, child_process_1.spawn)('java', ['-cp', javaPath, javaClass]);
        javaProcess.on('exit', () => {
            if (this.keepAlive) {
                console.log('Java process exited. Restarting...');
                this.javaProcess = this.spawnJavaProcess(javaClass);
            }
        });
        javaProcess.stdout.once('data', data => console.log('Startup:', data.toString()));
        return javaProcess;
    }
    dispose() {
        this.keepAlive = false;
        this.javaProcess.kill();
    }
}
exports.JavaController = JavaController;
function disposeControllers() {
    activeControllers.forEach(controller => controller.dispose());
}
exports.disposeControllers = disposeControllers;
//# sourceMappingURL=javaController.js.map