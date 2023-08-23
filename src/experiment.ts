
import { getGame } from './utils';
import { compact } from './codeProvider';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

const knwonGames = {
    "Ngre E E": "(game \"Ngre E E\" (players 2) (equipment {(board (rectangle 3 3 diagonals:Alternating) use:Vertex) (hand Each) (piece \"Marker\" Each)}) (rules (start (place \"Marker\" \"Hand\" count:3)) (play (move (from (handSite Mover)) (to (sites Empty)))) (end (if (is Line 3) (result Mover Win)))))",
    "Latin Square": "(game \"Latin Square\" (players 1) (equipment {(board (square 5) (values Cell (range 1 5))) (regions {Columns Rows})}) (rules (play (satisfy (all Different))) (end (if (is Solved) (result P1 Win)))))",
    "Capture the Queen": "(game \"Capture the Queen\" (players 2) (equipment {(board (square 8)) (piece \"Queen\" Each (move Slide (to if:(is Enemy (who at:(to))) (apply (remove (to))))))}) (rules (start {(place \"Queen2\" coord:\"D8\") (place \"Queen1\" {\"B1\" \"C1\" \"E1\" \"F1\"})}) (play (forEach Piece)) (end {(if (no Pieces P2) (result P2 Loss)) (if (= (count Moves) 100) (result P2 Win))})))"
}

const logFileMap: Map<string, string> = new Map();

export function subscribeExperiment(context: vscode.ExtensionContext){
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            // Check if the event's document is the active text editor's document
            if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
                const filePath = event.document.uri.fsPath;
                const fileName = path.basename(filePath, path.extname(filePath));
                if (fileName != "Ngre E E" && fileName != "Latin Square" && fileName != "Capture the Queen") {
                    return;
                }
                
                const fileContent = event.document.getText();
                const distance = levenshtein(compact(knwonGames[fileName]), compact(getGame(fileContent)));

                

                // Check if we already have a log file for this document
                let logFilePath = logFileMap.get(filePath);
                
                if (!logFilePath) {
                    // If not, create a new one
                    const logFileName = `${fileName}_${Date.now()}.log`;
                    logFilePath = path.join(path.dirname(filePath), logFileName);
                    logFileMap.set(filePath, logFilePath);
                }

                const logMessage = `[${new Date().getTime()}]: ${distance}\n`;

                // Append the log message to the log file
                fs.appendFile(logFilePath, logMessage, (err) => {
                    if (err) {
                        console.error(`Failed to log to file: ${err.message}`);
                    }
                });
            }
        })
    );
}


function levenshtein(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // Substitution
                    Math.min(
                        matrix[i][j - 1] + 1,   // Insertion
                        matrix[i - 1][j] + 1    // Deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}