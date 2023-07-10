import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

let activeControllers: JavaController[] = []

export class JavaController {
    private javaProcess: ChildProcessWithoutNullStreams;
    private keepAlive: boolean = true;
    private lock = false;
    private readQueue: string = '';

    constructor(javaClass: string) {
        this.javaProcess = this.spawnJavaProcess(javaClass);
        activeControllers.push(this);
    }

    public write(text: string) {
        if (this.lock) throw "Can not write bacause the previous read operation is ongoing.";
        // console.log('\nPROVIDING:', text);

        this.javaProcess.stdin.write(text + '\n');
    }

    public read(): Promise<string> {
        if (this.lock) throw "Can not read bacause the previous read operation is ongoing.";
        console.log('\nREAD QUEUE:', this.readQueue);

        const nextNewLine = this.readQueue.indexOf('\n');
        if (nextNewLine > -1) {
            const result = this.readQueue.substring(0, nextNewLine);
            this.readQueue = this.readQueue.substring(nextNewLine + 1);
            return Promise.resolve(result);
        }

        return new Promise((resolve, reject) => {
            this.lock = true;
            let result = this.readQueue;

            const dataHandler = (data: Buffer) => {
                console.log('PARTIAL:', data.toString());
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

                    resolve(result);

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

    public spawnJavaProcess(javaClass: string): ChildProcessWithoutNullStreams {
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
    
        const javaProcess = spawn('java', ['-cp', javaPath, javaClass]);

        javaProcess.on('exit', () => {
            if (this.keepAlive) {
                console.log('Java process exited. Restarting...');
                this.javaProcess = this.spawnJavaProcess(javaClass);
            }
        });

        javaProcess.stdout.once('data', data => console.log('Startup:', data.toString()));

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