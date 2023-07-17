import { Completion } from "./compiler";

import * as https from 'https';
import * as vscode from 'vscode';

const systemMessage = "You are an AI system designed to invent a novel board game inspired by the user's favorite games. Your response will exclusivelly contain a detailed explenation of the mechanics of the novel game. Your explenation will be succinct and follow the same format as the user's.";
const examples = [
    {
        "favorites": [
            "Hex: Players take turns placing a piece of their colour at an empty cell, and win by connecting their board sides with a chain of their pieces. The game is played on a 11x11 board. The game uses the swap rule. The first player to connect their two sides wins.",
            "The Game of Y: Players take turns placing a piece of their colour on an empty cell. A player wins by connecting all three board sides with a connected group of their pieces.",
            "Go: Played on a 19x19 board. The board begins empty. One player plays as black, the other as white. The black player begins by placing a piece on one of the intersections on the board. Players alternate turns placing a piece on the board. A player may pass at any time. A piece or a group of pieces are captured when they are completely surrounded on all sides on adjacent intersections by the opposing player. Stones cannot be placed to recreate a previous position. The game ends when both players pass consecutively. Players total the number of intersections their pieces occupy or surround. The player with the highest total wins."
        ],
        "response": "Pippinzip: This game is played on a square grid board of any size, though 13x13 or 19x19 are recommended. Then the players take it in turns to place 1-3 black stones each turn until one decides to pass; that player then becomes Black, and the other becomes White.  After that, players take it in turns to place one stone of their colour on the board on any empty point.  If Black connects any two sides of the board with a single orthogonally-connected group, they win; White wins if they connect all four sides with a group connected either orthogonally or diagonally. During the initial chicken ballot phase, you may add stones by clicking on available spaces, or skip the rest of your placements (by choosing the Next Player action).  Alternatively, you may Pass at the start of your turn to take Black.  After that, you and your opponent will alternate playing one stone of your colour per turn, until one player forms a connection (draws are impossible in Pippinzip)."
    }
];

const test = [
    "HexGo: The board begins empty. One player plays as black, the other as white. The black player begins by placing a piece on one of the intersections on the board. Players alternate turns placing a piece on the board. A player may pass at any time. A piece or a group of pieces are captured when they are completely surrounded on all sides on adjacent intersections by the opposing player. Stones cannot be placed to recreate a previous position. The game ends when both players pass consecutively. Players total the number of intersections their pieces occupy or surround. The player with the highest total wins. For more info on this version please google Hexagonal Go.",
    "Yavalath: Players alternate turns placing pieces on one of the spaces. The first player to place four in a row without first making three in a row wins.",
    "Nine Men's Morris: Played on a board of three concentric squares, with a line bisecting the perimeters of each square on each side, but not extending inside the perimeter of the central square. Play occurs on the intersections of the lines and the corners of the squares. Each player has nine pieces. Play begins with each player placing pieces on empty points. If they make three in a row along the lines, they can remove one of the opponent's pieces. They cannot remove an opponent's piece that is in a three-in-a-row formation unless there are no other options. Once all pieces are placed, players take turns moving pieces one spot to an adjacent point along the lines. If a player makes three in a row, an opponent's piece is removed as in the first phase of the game. Once a player is reduced to three pieces, that player may move to any open space on the board. The game is won when the opponent is reduced to two pieces."
];

export class DescriptionProvider {
    private apiKey: string = "";
    constructor () {}


    public async streamCompletions(completionHandler: (completions: Completion[]) => void, interrupted: () => boolean): Promise<void> {
        let messages = [{"role": "system", "content": systemMessage}];
        for (const example of examples) {
            messages.push({"role": "user", "content": example.favorites.join("\n")});
            messages.push({"role": "assistant", "content": example.response});

        messages.push({"role": "user", "content": test.join("\n")});

        //messages = [{"role": "system", "content": "You are a helpful assistant."}, {role: "user", content: "Hello world"}];

        const data = JSON.stringify({"model": "gpt-3.5-turbo", "messages": messages, "stream": true});

        if (!this.apiKey)
            await this.requestAPIKey();
    
        const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'Authorization': `Bearer ${this.apiKey}`
            }
        };

        const pattern = /"delta"\s*:\s*{"content"\s*:\s*"([^"]*)"}/;
        
        const req = https.request(options, (res) => {
            let data = '';
    
            res.on('data', (chunk) => {
                console.log(chunk.toString().trim());
                const match = chunk.toString().match(pattern);

                if (match && match[1]) {
                    console.log(`The delta content is: ${match[1]}`);
                    data += match[1];
                } else {
                    console.log('No delta content found');
                }

                if (!interrupted())
                    completionHandler([{compiles: true, score: 1, value: '// ' + data}]);
            });
    
            res.on('end', () => {
               
            });
        });
    
        req.on('error', (error) => {
            console.log(error);
        });
    
        req.write(data);
        req.end();
        
    }
}

    private async requestAPIKey(): Promise<void> {
        this.apiKey = await vscode.window.showInputBox({
            placeHolder: "Inference URL",
            prompt: "Follow the instruction from the Colab notebook to obtain an inference URL.",
        }) || "";
    }

    async badAPIKey(): Promise<void> {
        this.apiKey = "";
        await vscode.window.showErrorMessage("Invalid inference URL. Please try again.");
    }
}