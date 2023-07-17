import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as vscode from 'vscode';

let activeControllers: JavaController[] = []

export class JavaController {
    private javaProcess: ChildProcessWithoutNullStreams;
    private keepAlive: boolean = true;
    private lock = false;
    private readQueue: string = '';

    constructor(private javaClass: string, private extensionUri: vscode.Uri) {
        this.javaProcess = this.spawnJavaProcess();
        activeControllers.push(this);
    }

    public write(text: string) {
        if (this.lock) throw "Can not write bacause the previous read operation is ongoing.";
        console.log('\nPROVIDING:', text);

        this.javaProcess.stdin.write(text.replaceAll('\n', '\\n') + '\n');
    }

    public read(): Promise<string> {
        if (this.lock) throw "Can not read bacause the previous read operation is ongoing.";
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

            const dataHandler = (data: Buffer) => {
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

                } else {
                    result += dataString;
                }
            };

            const errorHandler = (error: Error) => {
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

    public clearQueue() {
        this.readQueue = '';
    }

    public spawnJavaProcess(): ChildProcessWithoutNullStreams {

        const javaRoot = vscode.Uri.joinPath(this.extensionUri, "Ludii Recommender");

        const javaPath = [
            'Generation/bin',
            'Common/bin',
            'Common/lib/json-20180813.jar',
            'Common/lib/Trove4j_ApacheCommonsRNG.jar',
            'Core/bin',
            'Core/lib/jfreesvg-3.4.jar',
            'Language/bin',
            'Evaluation/bin',
            'AI/bin',
            'Player/bin',
            'Recommender/bin',
            'Manager/bin',
            'ViewController/bin',
            'Mining/bin',
        ].map(module => vscode.Uri.joinPath(javaRoot, module).fsPath).join(':');
    
        const javaProcess = spawn('java', ['-cp', javaPath, this.javaClass], {cwd: javaRoot.fsPath});

        javaProcess.on('exit', (code, signal) => {
            if (this.keepAlive) {
                console.log(this.javaClass + ' exited. with exit code ' + code + ' and signal ' + signal + '. Restarting...');
                console.log('cd "' + this.extensionUri + '"');
                console.log('java -cp "' + javaPath + '" ' + this.javaClass);
                this.javaProcess = this.spawnJavaProcess();
            }
        });

        javaProcess.stdout.once('data', data => console.log(this.javaClass + ' startup:', data.toString()));

        return javaProcess;
    }

    public dispose() {
        this.keepAlive = false;
        this.javaProcess.kill();
    }
}

export function disposeControllers() {
    activeControllers.forEach(controller => controller.dispose());
}