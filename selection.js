// selection.js - HANDLES MOUSE SELECTION LOGIC (SPACE PRESERVER)

var isSelectionMode = false;
var selectionTranslation = "";

function hideSelectionBox() {
    if (isSelectionMode) {
        isSelectionMode = false;
        selectionTranslation = "";
        if (typeof suggestionBox !== 'undefined' && suggestionBox) {
            suggestionBox.style.display = 'none';
        }
    }
}

function isEditableArea(sel) {
    if (!sel || sel.rangeCount === 0) return false;
    let node = sel.anchorNode;
    if (!node) return false;
    
    let el = node.nodeType === 3 ? node.parentNode : node; 
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return true;
    if (el.isContentEditable || (el.closest && el.closest('[contenteditable="true"]'))) return true;
    
    let active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT' || active.isContentEditable)) {
        return true;
    }
    return false;
}

function handleTextSelection() {
    let sel = window.getSelection();
    let originalText = sel.toString(); // Keeping the exact text (with spaces)
    let text = originalText.trim();    // Trimmed version for the API
    
    if (text.length > 1 && isEditableArea(sel)) {
        isSelectionMode = true;
        
        // 1. Save leading and trailing spaces from the original selection
        let leadingSpaces = originalText.match(/^\s*/)[0];
        let trailingSpaces = originalText.match(/\s*$/)[0];
        
        renderVSCodeSuggestion(["Translating to English..."], 0);
        let rect = sel.getRangeAt(0).getBoundingClientRect();
        if (typeof positionSuggestionBox === 'function') positionSuggestionBox(rect); 

        fetchSentenceTranslation(text).then(translation => {
            if (translation && isSelectionMode && window.getSelection().toString() === originalText) {
                
                // 2. Add the spaces back to the final translation
                selectionTranslation = leadingSpaces + translation + trailingSpaces;
                
                renderVSCodeSuggestion([translation], 0);
                if (typeof positionSuggestionBox === 'function') positionSuggestionBox(rect);
            }
        });
    } else {
        hideSelectionBox();
    }
}

document.addEventListener('mouseup', function(e) {
    if (typeof suggestionBox !== 'undefined' && suggestionBox && suggestionBox.contains(e.target)) return;
    handleTextSelection();
});

document.addEventListener('keyup', (e) => {
    if (e.shiftKey && e.code.includes('Arrow')) {
        handleTextSelection();
    }
});

document.addEventListener('selectionchange', () => {
    let text = window.getSelection().toString().trim();
    if (text.length <= 1) {
        hideSelectionBox();
    }
});