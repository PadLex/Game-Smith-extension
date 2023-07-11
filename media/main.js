//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    // @ts-ignore
    const vscode = acquireVsCodeApi();

    const oldState = vscode.getState() || { completions: [], selectedCompletion: null, active: true };
    updateState(oldState.completions, oldState.selectedCompletion, oldState.active);

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'setState':
                {
                    const state = vscode.getState();
                    const completions = message.completions != undefined? message.completions : state.completions;
                    const selectedCompletion = message.selectedCompletion != undefined? message.selectedCompletion : state.selectedCompletion;
                    const active = message.active != undefined? message.active : state.active;
                    if (completions != oldState.completions || selectedCompletion != oldState.selectedCompletion || active != oldState.active)
                        updateState(completions, selectedCompletion, active);
                    break;
                }
            default: {
                console.warn("Unknown message type: " + message.type);
            }

        }
    });

    /**
     * @param {Array<{ value: string, score: number, compiles: boolean }>} completions
     * @param {{ value: string, score: number, compiles: boolean }} selectedCompletion
     */
    function updateState(completions, selectedCompletion, active) {
        // console.log("updateState:", completions, selectedCompletion);

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
            input.value = '...' + completion.value;

            if (active) {
                input.addEventListener('mousedown', () => onCompletionClicked(completion));
                if (completion.value == selectedCompletion.value)
                    input.style.border = '1px solid var(--vscode-focusBorder)';
            }
            
            li.appendChild(input);

            ul.appendChild(li);
        }

        // Update the saved state
        vscode.setState({ completions: completions, selectedCompletion: selectedCompletion, active: active });
    }

    /**
     * @param {{ value: string, score: number, compiles: boolean }} completion
     */
    function onCompletionClicked(completion) {
        vscode.postMessage({ type: 'completionClicked', completion: completion});
    }

}());

