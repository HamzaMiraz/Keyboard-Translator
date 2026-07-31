// ui.js - VS CODE STYLE UI LOGIC (UPDATED FOR LONG SENTENCES)

let suggestionBox = null;

function createSuggestionBox() {
    suggestionBox = document.createElement('div');
    suggestionBox.style.position = 'absolute';
    suggestionBox.style.backgroundColor = '#252526'; 
    suggestionBox.style.border = '1px solid #454545';
    suggestionBox.style.borderRadius = '3px';
    suggestionBox.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.5)';
    suggestionBox.style.fontFamily = "Consolas, 'Courier New', monospace";
    suggestionBox.style.fontSize = '13px';
    suggestionBox.style.zIndex = '999999';
    suggestionBox.style.display = 'none';
    suggestionBox.style.overflow = 'hidden';
    suggestionBox.style.maxWidth = '450px'; // Allow larger box for sentences
    document.body.appendChild(suggestionBox);
}

function renderVSCodeSuggestion(suggestion) {
    let rowHTML = `
        <div style="display: flex; align-items: center; background-color: #04395e; padding: 4px 8px; cursor: default;">
            <div style="display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; margin-right: 6px; color: #9cdcfe; font-size: 11px; letter-spacing: -1px; flex-shrink: 0;">
                abc
            </div>
            <div style="flex-grow: 1; color: #ffffff; white-space: normal; word-wrap: break-word; line-height: 1.4;">
                ${suggestion}
            </div>
            <div style="color: #858585; font-size: 11px; margin-left: 15px; flex-shrink: 0;">
                Tab
            </div>
        </div>
    `;
    suggestionBox.innerHTML = rowHTML;
}