export function getGame(text: string): string {
    text = text.replace(/(^|\n)\s*\/\/.*?($|\n)/g, '\n'); // Remove comments
    text = text.replace(/\n/g, ' '); // Remove newlines
    text = text.trim();
    return text;
}

export function getComments(text: string): string {
    let commentLines = text.match(/(^|\n)\s*\/\/.*?($|\n)/g);

    let commentContents = "";
    if (commentLines) {
        commentContents += commentLines.map(line => line.replace(/(^|\n)\s*\/\/\s?/, '').trim()) + ' ';
    }
    return commentContents;
}