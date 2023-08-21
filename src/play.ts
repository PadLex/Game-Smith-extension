import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as vscode from 'vscode';
import * as fs from 'fs';

const paths = ["PlayerDesktop/bin","Player/bin","Language/bin","Common/bin","Common/lib/json-20180813.jar","Common/lib/Trove4j_ApacheCommonsRNG.jar","Common/lib/jfreesvg-3.4.jar","Manager/bin","AI/bin","Features/bin","Core/bin","Evaluation/bin","ViewController/bin","ViewController/lib/batik-anim-1.11.jar","ViewController/lib/batik-awt-util-1.11.jar","ViewController/lib/batik-bridge-1.11.jar","ViewController/lib/batik-constants-1.11.jar","ViewController/lib/batik-css-1.11.jar","ViewController/lib/batik-dom-1.11.jar","ViewController/lib/batik-ext-1.11.jar","ViewController/lib/batik-gvt-1.11.jar","ViewController/lib/batik-i18n-1.11.jar","ViewController/lib/batik-parser-1.11.jar","ViewController/lib/batik-rasterizer-1.11.jar","ViewController/lib/batik-script-1.11.jar","ViewController/lib/batik-svg-dom-1.11.jar","ViewController/lib/batik-svggen-1.11.jar","ViewController/lib/batik-transcoder-1.11.jar","ViewController/lib/batik-util-1.11.jar","ViewController/lib/batik-xml-1.11.jar","Player/lib/batik-codec-1.14.jar","Mining/bin","Common/lib/hamcrest-all-1.3.jar","Common/lib/junit-4.12.jar","Common/lib/Trove4j_ApacheCommonsRNG-sources.jar","Player/lib/activation-1.1.1.jar","Player/lib/batik-anim-1.11.jar","Player/lib/batik-awt-util-1.11.jar","Player/lib/batik-bridge-1.11.jar","Player/lib/batik-constants-1.11.jar","Player/lib/batik-css-1.11.jar","Player/lib/batik-dom-1.11.jar","Player/lib/batik-ext-1.11.jar","Player/lib/batik-gvt-1.11.jar","Player/lib/batik-i18n-1.11.jar","Player/lib/batik-parser-1.11.jar","Player/lib/batik-rasterizer-1.11.jar","Player/lib/batik-script-1.11.jar","Player/lib/batik-svg-dom-1.11.jar","Player/lib/batik-svggen-1.11.jar","Player/lib/batik-transcoder-1.11.jar","Player/lib/batik-util-1.11.jar","Player/lib/batik-xml-1.11.jar","Player/lib/jaxb-api-2.3.1.jar","Player/lib/xml-apis-ext-1.3.04.jar","Player/lib/xmlgraphics-commons-2.3.jar","Generation/bin","Recommender/bin","Player/lib/javax.mail.jar"]
let previousJavaProcess: ChildProcessWithoutNullStreams | undefined;

export function startGame(extensionUri: vscode.Uri, documentUri: vscode.Uri): ChildProcessWithoutNullStreams {

    if (previousJavaProcess) {
        previousJavaProcess.kill();
    }

    const javaRoot = vscode.Uri.joinPath(extensionUri, "Ludii Recommender");
    const workingDir = vscode.Uri.joinPath(javaRoot, "PlayerDesktop");
    setGamePath(workingDir, documentUri);

    const javaPath = paths.map(module => vscode.Uri.joinPath(javaRoot, module).fsPath).join(':');

    console.log( javaPath );

    const javaProcess = spawn('java', ['-cp', javaPath, "app.StartDesktopApp"], {cwd: workingDir.fsPath});

    return javaProcess;
}

function setGamePath(workingDir: vscode.Uri, documentUri: any) {
    // Convert the URI to a file path
    const preferencesPath = vscode.Uri.joinPath(workingDir, "ludii_preferences.json").fsPath;

    // Read the existing JSON content
    fs.readFile(preferencesPath, 'utf8', (readErr, data) => {
        if (readErr) {
            console.error('Error reading JSON file:', readErr);
            return;
        }

        try {
            // Parse the JSON content
            const jsonContent = JSON.parse(data);

            // Set the parameter's value to the new value
            jsonContent["savedLudName"] = documentUri.fsPath;
            jsonContent["RecentGames_0"] = documentUri.fsPath;
            jsonContent["LoadedFromMemory"] = "true";
            // delete jsonContent["RecentGames_0"];

            // Write the updated JSON content back to the file
            fs.writeFile(preferencesPath, JSON.stringify(jsonContent, null, 4), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error('Error writing JSON file:', writeErr);
                } else {
                    console.log('JSON file updated successfully.');
                }
            });
        } catch (parseErr) {
            console.error('Error parsing JSON content:', parseErr);
        }
    });

    const trlPath = vscode.Uri.joinPath(workingDir, "ludii.trl").fsPath;
    const newTrl = "game=" + documentUri.fsPath + "\nSTART GAME OPTIONS\nEND GAME OPTIONS\nRNG internal state=-20,-57,-50,60,-35,-62,1,12\nnumInitialPlacementMoves=0\nrankings=0.0,0.0,0.0\nSANDBOX=false\nLUDII_VERSION=1.3.10"
    fs.writeFile(trlPath, newTrl, 'utf8', (writeErr) => {
        if (writeErr) {
            console.error('Error writing TRL file:', writeErr);
        } else {
            console.log('TRL file updated successfully.');
        }
    });
}
