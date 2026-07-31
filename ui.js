// ui.js - VS CODE STYLE UI LOGIC (WITH HOVER SUPPORT)

var suggestionBox = null;

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
    suggestionBox.style.maxWidth = '450px';
    document.body.appendChild(suggestionBox);

    // Handle Mouse Clicks safely
    suggestionBox.addEventListener('mousedown', function(e) {
        e.preventDefault(); 
        let item = e.target.closest('.suggestion-item');
        if (item) {
            let index = parseInt(item.getAttribute('data-index'));
            document.dispatchEvent(new CustomEvent('suggestionClicked', { detail: { index: index } }));
        }
    });

    // Handle Mouse Hover to update selection visually
    suggestionBox.addEventListener('mouseover', function(e) {
        let item = e.target.closest('.suggestion-item');
        if (item) {
            let index = parseInt(item.getAttribute('data-index'));
            document.dispatchEvent(new CustomEvent('suggestionHovered', { detail: { index: index } }));
        }
    });
}

function renderVSCodeSuggestion(suggestionsList, selectedIndex) {
    if (!suggestionsList || suggestionsList.length === 0) return;
    
    let html = '';
    suggestionsList.forEach((sug, i) => {
        let isSelected = (i === selectedIndex);
        let bg = isSelected ? '#04395e' : 'transparent';
        let iconColor = isSelected ? '#9cdcfe' : 'transparent';
        let hint = isSelected ? 'Tab' : '';
        
        html += `
            <div class="suggestion-item" data-index="${i}" style="display: flex; align-items: center; background-color: ${bg}; padding: 4px 12px; cursor: pointer; min-width: 180px;">
                <div style="display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; margin-right: 6px; color: ${iconColor}; font-size: 11px; letter-spacing: -1px; flex-shrink: 0;">
                    abc
                </div>
                <div style="flex-grow: 1; color: #ffffff; white-space: normal; word-wrap: break-word; line-height: 1.4;">
                    ${sug}
                </div>
                <div style="color: #858585; font-size: 11px; margin-left: 15px; flex-shrink: 0;">
                    ${hint}
                </div>
            </div>
        `;
    });
    
    suggestionBox.innerHTML = html;
}