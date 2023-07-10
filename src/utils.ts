export function getGame(text: string): string {
    text = text.replace(/(^|\s)\/\/.*/g, ''); // Remove comments
    text = text.trim();
    return text;
}

export function getComments(text: string): string {

    let comments = Array.from(text.matchAll(/(^|\s)\/\/.*/g)).map((match) => match[0]).join(' ');
    comments = comments.replace(/\/\//g, ''); // Note: this will remove all "//", not just those at the start of comments
    comments = comments.replace(/\s+/g, ' '); // Replace all sequences of whitespace with a single space
    comments = comments.trim(); // Remove leading and trailing spaces
    return comments;
}