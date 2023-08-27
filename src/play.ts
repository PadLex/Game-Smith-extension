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
    // fs.readFile(preferencesPath, 'utf8', (readErr, data) => {
    //     if (readErr) {
    //         console.error('Error reading JSON file:', readErr);
    //         return;
    //     }

    //     try {
    //         // Parse the JSON content
    //         const jsonContent = JSON.parse(data);

    //         // Set the parameter's value to the new value
    //         jsonContent["savedLudName"] = documentUri.fsPath;
    //         jsonContent["RecentGames_0"] = documentUri.fsPath;
    //         jsonContent["LoadedFromMemory"] = "true";
    //         // delete jsonContent["RecentGames_0"];

    //         // Write the updated JSON content back to the file
    //         fs.writeFile(preferencesPath, JSON.stringify(jsonContent, null, 4), 'utf8', (writeErr) => {
    //             if (writeErr) {
    //                 console.error('Error writing JSON file:', writeErr);
    //             } else {
    //                 console.log('JSON file updated successfully.');
    //             }
    //         });
    //     } catch (parseErr) {
    //         console.error('Error parsing JSON content:', parseErr);
    //     }
    // });

    fs.writeFile(preferencesPath, jsonContent(documentUri.fsPath), 'utf8', (writeErr) => {
        if (writeErr) {
            console.error('Error writing TRL file:', writeErr);
        } else {
            console.log('TRL file updated successfully.');
        }
    });

    const trlPath = vscode.Uri.joinPath(workingDir, "ludii.trl").fsPath;
    fs.writeFile(trlPath, trlContent(documentUri.fsPath), 'utf8', (writeErr) => {
        if (writeErr) {
            console.error('Error writing TRL file:', writeErr);
        } else {
            console.log('TRL file updated successfully.');
        }
    });
}


function trlContent(path: string): string {
    return "game=" + path + "\nSTART GAME OPTIONS\nEND GAME OPTIONS\nRNG internal state=-20,-57,-50,60,-35,-62,1,12\nnumInitialPlacementMoves=0\nrankings=0.0,0.0,0.0\nSANDBOX=false\nLUDII_VERSION=1.3.10";
}

function jsonContent(path: string) {
    return "{\"ShowEndingMove\": true,\n \"Names_2\": \"Player 2\",\n \"MenuNames_16\": \"Human\",\n \"Names_1\": \"Player 1\",\n \"MenuNames_15\": \"Human\",\n \"Names_16\": \"Player 16\",\n \"Names_0\": \"Player 0\",\n \"MenuNames_14\": \"Human\",\n \"ShowCoordinates\": false,\n \"MenuNames_13\": \"Human\",\n \"Names_6\": \"Player 6\",\n \"Names_13\": \"Player 13\",\n \"Names_5\": \"Player 5\",\n \"Names_12\": \"Player 12\",\n \"Names_4\": \"Player 4\",\n \"Names_15\": \"Player 15\",\n \"drawInnerVertices\": false,\n \"Names_3\": \"Player 3\",\n \"Names_14\": \"Player 14\",\n \"networkPolling\": false,\n \"drawInnerEdges\": false,\n \"Names_11\": \"Player 11\",\n \"Names_10\": \"Player 10\",\n \"MenuNames_12\": \"Human\",\n \"drawInnerCells\": false,\n \"MenuNames_11\": \"Human\",\n \"MenuNames_10\": \"Human\",\n \"MoveCoord\": true,\n \"drawOuterEdges\": false,\n \"PhaseTitle\": false,\n \"drawMinorVertices\": false,\n \"alwaysAutoPass\": false,\n \"drawCornerConvexEdges\": false,\n \"drawPhasesVertices\": false,\n \"drawHorizontalEdges\": false,\n \"drawCornerConvexCells\": false,\n \"LoadedFromMemory\": true,\n \"CursorTooltip\": false,\n \"drawOuterCells\": false,\n \"NoRepetition\": false,\n \"drawCenterCells\": false,\n \"ShowConnections\": false,\n \"drawMajorVertices\": false,\n \"SavedLudLastModifiedTime\": \"2023-08-24T18:49:21.038050317Z\",\n \"drawCornerConvexVertices\": false,\n \"drawNeighboursVertices\": false,\n \"Names_9\": \"Player 9\",\n \"Names_8\": \"Player 8\",\n \"drawDistanceEdges\": false,\n \"Names_7\": \"Player 7\",\n \"drawBottomVertices\": false,\n \"drawBottomCells\": false,\n \"ShowFaceCoordinates\": false,\n \"RecentGames_2\": \"Tic-Tac-Toe\",\n \"RecentGames_1\": \"Hex\",\n \"FrameWidth\": 1080,\n \"drawSlashEdges\": false,\n \"drawCornersCells\": false,\n \"OptionStrings\": [],\n \"drawLeftEdges\": false,\n \"drawAngledEdges\": false,\n \"RecentGames_0\": \"" + path + "\",\n \"drawDistanceCells\": false,\n \"drawPerimeterVertices\": false,\n \"drawBottomEdges\": false,\n \"editorFontSize\": 13,\n \"SaveHeuristics\": false,\n \"drawRadialsCells\": false,\n \"drawOuterVertices\": false,\n \"drawMajorCells\": false,\n \"drawLeftCells\": false,\n \"drawRadialsVertices\": false,\n \"VersionNumber\": \"1.3.10\",\n \"editorAutocomplete\": true,\n \"MenuNames_6\": \"Human\",\n \"MenuNames_7\": \"Human\",\n \"MenuNames_8\": \"Human\",\n \"ShowRepetitions\": false,\n \"drawCenterVertices\": false,\n \"MenuNames_9\": \"Human\",\n \"savedLudName\": \"" + path + "\",\n \"FlatBoard\": false,\n \"ShowFaceIndices\": false,\n \"coordWithOutline\": false,\n \"moveSoundEffect\": false,\n \"ShowPieces\": true,\n \"ShowAxes\": false,\n \"moveFormat\": \"Move\",\n \"drawRightVertices\": false,\n \"drawCentreEdges\": false,\n \"MenuNames_0\": \"Human\",\n \"MenuNames_1\": \"Human\",\n \"testLudeme2\": \"\",\n \"MenuNames_2\": \"Human\",\n \"testLudeme3\": \"\",\n \"MenuNames_3\": \"Human\",\n \"MenuNames_4\": \"Human\",\n \"testLudeme1\": \"\",\n \"MenuNames_5\": \"Human\",\n \"SwapRule\": false,\n \"drawNeighboursCells\": false,\n \"drawTopVertices\": false,\n \"FrameMaximizedBoth\": false,\n \"SelectedRuleset\": -1,\n \"ShowGraph\": false,\n \"drawSloshEdges\": false,\n \"showZoomBox\": false,\n \"ShowIndices\": false,\n \"ShowEdgeCoordinates\": false,\n \"FrameHeight\": 675,\n \"ShowBoard\": true,\n \"HideAiMoves\": true,\n \"ShowEdgeIndices\": false,\n \"testLudeme4\": \"\",\n \"drawMajorEdges\": false,\n \"devMode\": false,\n \"saveTrialAfterMove\": false,\n \"CandidateMoves\": false,\n \"IllegalMoves\": false,\n \"drawRightEdges\": false,\n \"drawMinorCells\": false,\n \"ShowPossibleMoves\": true,\n \"ShowContainerIndices\": false,\n \"drawPerimeterCells\": false,\n \"ShowLastMove\": false,\n \"NoRepetitionWithinTurn\": false,\n \"drawCornersVertices\": false,\n \"drawAxialEdges\": false,\n \"PuzzleValueSelection\": \"Automatic\",\n \"drawDistanceVertices\": false,\n \"drawTopEdges\": false,\n \"ShowVertexCoordinates\": false,\n \"drawPhasesEdges\": false,\n \"drawRightCells\": false,\n \"drawCornerConcaveEdges\": false,\n \"drawMinorEdges\": false,\n \"drawCornerConcaveVertices\": false,\n \"drawCornerEdges\": false,\n \"ShowAIDistribution\": false,\n \"tabFontSize\": 13,\n \"ShowCellIndices\": false,\n \"drawPerimeterEdges\": false,\n \"FrameLocX\": 179,\n \"AnimationVisualsType\": \"None\",\n \"FrameLocY\": 125,\n \"networkRefresh\": false,\n \"editorParseText\": true,\n \"TickLength\": 0.1,\n \"drawSideNumberVertices\": 0,\n \"drawLeftVertices\": false,\n \"drawVerticalEdges\": false,\n \"drawTopCells\": false,\n \"drawCornerConcaveCells\": false,\n \"drawPhasesCells\": false\n}";
}