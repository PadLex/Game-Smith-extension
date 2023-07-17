"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disposeControllers = exports.JavaController = void 0;
const child_process_1 = require("child_process");
let activeControllers = [];
class JavaController {
    javaProcess;
    keepAlive = true;
    lock = false;
    readQueue = '';
    constructor(javaClass) {
        this.javaProcess = this.spawnJavaProcess(javaClass);
        activeControllers.push(this);
    }
    write(text) {
        if (this.lock)
            throw "Can not write bacause the previous read operation is ongoing.";
        console.log('\nPROVIDING:', text);
        this.javaProcess.stdin.write(text.replaceAll('\n', '\\n') + '\n');
    }
    read() {
        if (this.lock)
            throw "Can not read bacause the previous read operation is ongoing.";
        console.log('\nREAD QUEUE:', this.readQueue);
        const nextNewLine = this.readQueue.indexOf('\n');
        if (nextNewLine > -1) {
            const result = this.readQueue.substring(0, nextNewLine);
            this.readQueue = this.readQueue.substring(nextNewLine + 1);
            return Promise.resolve(result.replaceAll('\\n', '\n'));
        }
        return new Promise((resolve, reject) => {
            this.lock = true;
            let result = this.readQueue;
            const dataHandler = (data) => {
                // console.log('PARTIAL:', data.toString());
                const dataString = data.toString();
                const nextNewLine = dataString.indexOf('\n');
                if (nextNewLine > -1) {
                    if (nextNewLine < dataString.length - 1)
                        this.readQueue = dataString.substring(nextNewLine + 1);
                    result += dataString.substring(0, nextNewLine);
                    // Clen-up
                    this.javaProcess.stdout.removeListener('data', dataHandler);
                    this.javaProcess.stderr.removeListener('error', errorHandler);
                    this.lock = false;
                    resolve(result.replaceAll('\\n', '\n'));
                }
                else {
                    result += dataString;
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
    clearQueue() {
        this.readQueue = '';
    }
    spawnJavaProcess(javaClass) {
        const projectRoot = '/Users/alex/Documents/Marble/Ludii Recommender/';
        const javaPath = [
            'Generation/bin',
            'Common/bin',
            'Common/lib/json-20180813.jar',
            'Common/lib/Trove4j_ApacheCommonsRNG.jar',
            'Core/bin',
            'Core/lib/jfreesvg-3.4.jar',
            'Language/bin',
            'Player/bin',
            'Recommender/bin',
        ].map(module => projectRoot + module).join(':');
        console.log(javaPath);
        const javaProcess = (0, child_process_1.spawn)('java', ['-cp', javaPath, javaClass], { cwd: projectRoot });
        javaProcess.on('exit', (code, signal) => {
            if (this.keepAlive) {
                console.log(javaClass + ' exited. with exit code ' + code + ' and signal ' + signal + '. Restarting...');
                this.javaProcess = this.spawnJavaProcess(javaClass);
            }
        });
        javaProcess.stdout.once('data', data => console.log(javaClass + ' startup:', data.toString()));
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