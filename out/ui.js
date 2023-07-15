"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionViewProvider = void 0;
const vscode = require("vscode");
const codeProvider_1 = require("./codeProvider");
const utils_1 = require("./utils");
class CompletionViewProvider {
    _extensionUri;
    codeProvider;
    descriptionProvider;
    static viewType = 'ludii.completionsView';
    _view;
    completionId = 0;
    activeGame = "";
    activeCompletion = { value: '', score: 0, compiles: false };
    constructor(_extensionUri, codeProvider, descriptionProvider) {
        this._extensionUri = _extensionUri;
        this.codeProvider = codeProvider;
        this.descriptionProvider = descriptionProvider;
        console.log("View provider created");
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        const verifyActive = () => {
            const text = vscode.window.activeTextEditor?.document.getText();
            if (text == undefined) {
                // console.log("No active text editor");
                this._view?.webview.postMessage({ type: 'setState', active: false });
            }
            else {
                const ludii = (0, utils_1.getGame)(text);
                // console.log("ludii  " + compact(ludii));
                // console.log("active " + compact(this.activeGame + this.activeCompletion));
                this._view?.webview.postMessage({ type: 'setState', active: (0, codeProvider_1.compact)(ludii) == (0, codeProvider_1.compact)(this.activeGame + this.activeCompletion.value) });
            }
        };
        vscode.window.onDidChangeActiveTextEditor(verifyActive);
        // This event is emitted when a text document is changed. This usually happens when the contents of the `TextDocument` are changed.
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === vscode.window.activeTextEditor?.document) {
                verifyActive();
            }
        });
        webviewView.webview.onDidReceiveMessage(data => {
            console.log("Message received: " + data.type);
            switch (data.type) {
                case 'completionClicked':
                    {
                        console.log("Completion selected: " + this.activeCompletion.value + " -> " + data.completion.value);
                        const activeEditor = vscode.window.activeTextEditor;
                        if (activeEditor) {
                            // Assuming oldValue is at the end of the document
                            const doc = activeEditor.document;
                            const start = doc.positionAt(doc.getText().length - this.activeCompletion.value.length);
                            const end = doc.positionAt(doc.getText().length);
                            const range = new vscode.Range(start, end);
                            if (doc.getText(range) != this.activeCompletion.value) {
                                this._view?.webview.postMessage({ type: 'setState', active: false });
                                return;
                            }
                            const edit = new vscode.WorkspaceEdit();
                            edit.delete(doc.uri, range);
                            vscode.workspace.applyEdit(edit).then(success => {
                                if (success) {
                                    // Insert new value only after successful deletion of old value
                                    this.activeCompletion = data.completion;
                                    activeEditor.insertSnippet(new vscode.SnippetString(data.completion.value), doc.positionAt(doc.getText().length));
                                    this._view?.webview.postMessage({ type: 'setState', selectedCompletion: data.completion, active: true });
                                }
                            });
                        }
                        break;
                    }
            }
        });
    }
    async findCompletions() {
        if (!this._view)
            return;
        this._view.show(true);
        const text = vscode.window.activeTextEditor?.document.getText() || '';
        this.completionId += 1;
        const completionId = this.completionId;
        const english = (0, utils_1.getComments)(text);
        const ludii = (0, utils_1.getGame)(text);
        if (english == "")
            this.updateDescriptionCompletions(completionId);
        else
            this.updateCodeCompletions(english, ludii, completionId);
    }
    async updateDescriptionCompletions(completionId) {
        this.descriptionProvider.streamCompletions(completions => this._view?.webview.postMessage({ type: 'setState', completions: completions }), () => completionId != this.completionId);
    }
    async updateCodeCompletions(english, ludii, completionId) {
        if (!this._view)
            return;
        let compiledBase = await this.codeProvider.compiler.compile(ludii);
        compiledBase.value = "";
        this.activeCompletion = compiledBase;
        this._view.webview.postMessage({ type: 'setState', completions: [compiledBase], selectedCompletion: compiledBase, active: true });
        this.activeGame = ludii;
        this.activeCompletion = compiledBase;
        if (completionId != this.completionId)
            return;
        this.codeProvider.streamCompletions(english, ludii, completions => {
            let allCompletions = [compiledBase, ...completions];
            if (allCompletions.filter(c => c.value == this.activeCompletion.value).length == 0)
                allCompletions = [compiledBase, this.activeCompletion, ...completions];
            this._view?.webview.postMessage({ type: 'setState', completions: allCompletions });
        }, () => completionId != this.completionId);
    }
    clearCompletions() {
        if (this._view) {
            this.completionId += 1;
            this._view.webview.postMessage({ type: 'setState', completions: [], selectedCompletion: null, active: false });
        }
    }
    _getHtmlForWebview(webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        // Do the same for the stylesheet.
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Cat Colors</title>
			</head>
			<body>
				<ul class="completion-list">
				</ul>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}
exports.CompletionViewProvider = CompletionViewProvider;
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=ui.js.map