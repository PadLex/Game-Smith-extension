"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComments = exports.getGame = void 0;
function getGame(text) {
    text = text.replace(/(^|\n)\s*\/\/.*?($|\n)/g, '\n'); // Remove comments
    text = text.replace(/\n/g, ' '); // Remove newlines
    text = text.trim();
    return text;
}
exports.getGame = getGame;
function getComments(text) {
    let commentLines = text.match(/(^|\n)\s*\/\/.*?($|\n)/g);
    let commentContents = "";
    if (commentLines) {
        commentContents += commentLines.map(line => line.replace(/(^|\n)\s*\/\/\s?/, '').trim()) + ' ';
    }
    return commentContents;
}
exports.getComments = getComments;
//# sourceMappingURL=utils.js.map