// selection.js - HANDLES MOUSE SELECTION LOGIC

var isSelectionMode = false;
var selectionTranslation = "";

// Helper function to hide the box instantly
function hideSelectionBox() {
    if (isSelectionMode) {
        isSelectionMode = false;
        selectionTranslation = "";
        suggestionBox.style.display = 'none';
    }
}

function handleTextSelection() {
    let sel = window.getSelection();
    let text = sel.toString().trim();
    
    if (text.length > 1) {
        isSelectionMode = true;
        
        renderVSCodeSuggestion(["Translating to English..."], 0);
        let rect = sel.getRangeAt(0).getBoundingClientRect();
        suggestionBox.style.top = (window.scrollY + rect.bottom + 8) + 'px';
        suggestionBox.style.left = (window.scrollX + rect.left) + 'px';
        suggestionBox.style.display = 'block';

        fetchSentenceTranslation(text).then(translation => {
            // Make sure the selection hasn't been cleared while API was loading
            if (translation && isSelectionMode && window.getSelection().toString().trim() === text) {
                selectionTranslation = translation;
                renderVSCodeSuggestion([translation], 0);
            }
        });
    } else {
        hideSelectionBox();
    }
}

// Ignore mouseup if the user is clicking on the suggestion box itself
document.addEventListener('mouseup', function(e) {
    if (suggestionBox && suggestionBox.contains(e.target)) return;
    handleTextSelection();
});

// Detect Shift + Arrow selection
document.addEventListener('keyup', (e) => {
    if (e.shiftKey && e.code.includes('Arrow')) {
        handleTextSelection();
    }
});

// NEW MAGIC: Instantly detect if selection is lost (mouse click away or keyboard move)
document.addEventListener('selectionchange', () => {
    let text = window.getSelection().toString().trim();
    // If there is no text selected, hide the box instantly
    if (text.length <= 1) {
        hideSelectionBox();
    }
});