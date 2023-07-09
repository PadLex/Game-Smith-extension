//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    // @ts-ignore
    const vscode = acquireVsCodeApi();

    const oldState = vscode.getState() || { completions: [] };

    /** @type {Array<{ value: string, score: number, compiles: boolean }>} */
    let completions = oldState.completions;

    updateCompletionsList(completions);

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'setCompletions':
                {
                    updateCompletionsList(message.value);
                    break;
                }
            case 'clearCompletions':
                {
                    completions = [];
                    updateCompletionsList(completions);
                    break;
                }

        }
    });

    /**
     * @param {Array<{ value: string, score: number, compiles: boolean }>} completions
     */
    function updateCompletionsList(completions) {
        const ul = document.querySelector('.completion-list');
        if (ul === null || ul === undefined) 
            return;
        
        ul.textContent = '';
        for (const completion of completions) {
            const li = document.createElement('li');
            li.className = 'completion-entry';

            const scoreDisplay = document.createElement('div');
            scoreDisplay.className = 'completion-score';
            scoreDisplay.style.color = completion.compiles? 'var(--vscode-foreground)' : 'var(--vscode-errorForeground)';
            scoreDisplay.textContent = completion.score.toFixed(1);
            li.appendChild(scoreDisplay);

            const input = document.createElement('input');
            input.className = 'completion-input';
            input.type = 'text';
            input.readOnly = true;
            input.value = completion.value;
            
            li.appendChild(input);

            ul.appendChild(li);
        }

        // Update the saved state
        vscode.setState({ completions: completions });
    }

    /** 
     * @param {string} completion 
     */
    function onCompletionClicked(completion) {
        vscode.postMessage({ type: 'completionSelected', value: completion });
    }
}());

