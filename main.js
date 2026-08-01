// main.js - CORE TYPING AND KEYBOARD EVENTS (PERFECT SPACING FIX)

var currentSuggestions = []; 
var selectedIndex = 0;       
var typedWordLength = 0;
var lastCursorInfo = null;
var activeWordRequest = ""; 

function getCursorInfo() {
    let el = document.activeElement;
    if (!el) return null;
    if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text')) {
        return { type: 'standard', element: el, text: el.value.substring(0, el.selectionStart) };
    } 
    let editableElement = el.closest('[contenteditable="true"]') || (el.isContentEditable ? el : null);
    if (editableElement) {
        let sel = window.getSelection();
        if (sel.rangeCount > 0 && sel.focusNode.nodeType === Node.TEXT_NODE) {
            return { type: 'modern', element: editableElement, node: sel.focusNode, offset: sel.focusOffset, text: sel.focusNode.nodeValue.substring(0, sel.focusOffset) };
        }
    }
    return null;
}

function replaceLastWord(info, newWord, addSpace) {
    if (info.type === 'standard') {
        let replacement = newWord + (addSpace ? " " : "");
        let el = info.element;
        let text = el.value;
        let cursorPos = el.selectionStart;
        let textBefore = text.substring(0, cursorPos - typedWordLength);
        let textAfter = text.substring(cursorPos);
        el.value = textBefore + replacement + textAfter;
        el.selectionStart = el.selectionEnd = textBefore.length + replacement.length;
        el.dispatchEvent(new Event('input', { bubbles: true }));
    } 
    else if (info.type === 'modern') {
        let node = info.node;
        let offset = info.offset;
        
        let textBefore = node.nodeValue.substring(0, offset - typedWordLength);
        let textAfter = node.nodeValue.substring(offset);
        
        // MAGIC FIX: If there is no text after, we use \u00A0 (Non-Breaking Space) 
        // to force the browser to visibly move the cursor forward!
        let spaceChar = "";
        if (addSpace) {
            spaceChar = (textAfter.length === 0) ? "\u00A0" : " ";
        }
        
        let replacement = newWord + spaceChar;
        node.nodeValue = textBefore + replacement + textAfter;
        
        let sel = window.getSelection();
        let range = document.createRange();
        let newOffset = textBefore.length + replacement.length;
        range.setStart(node, newOffset);
        range.setEnd(node, newOffset);
        sel.removeAllRanges();
        sel.addRange(range);
        
        info.element.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (suggestionBox) suggestionBox.style.display = 'none';
    currentSuggestions = [];
    selectedIndex = 0;
    typedWordLength = 0;
}

// TYPING LOGIC
document.addEventListener('keyup', function(e) {
    if (e.code === 'Tab' || e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'ArrowUp') return;
    if (typeof isSelectionMode !== 'undefined' && isSelectionMode) return; 

    let info = getCursorInfo();
    if (!info) {
        if (suggestionBox) suggestionBox.style.display = 'none';
        return;
    }

    let words = info.text.split(/[\s\n]+/);
    let lastWord = words[words.length - 1];
    
    if (lastWord.trim() !== "" && /^[a-zA-Z]+$/.test(lastWord)) {
        
        let localSuggestion = convertToBangla(lastWord);
        currentSuggestions = [localSuggestion];
        selectedIndex = 0;
        typedWordLength = lastWord.length;
        lastCursorInfo = info;
        
        let rect;
        if (info.type === 'modern' && window.getSelection().rangeCount > 0) {
            rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) rect = info.element.getBoundingClientRect();
        } else {
            rect = info.element.getBoundingClientRect();
        }
        
        renderVSCodeSuggestion(currentSuggestions, selectedIndex);
        if (typeof positionSuggestionBox === 'function') positionSuggestionBox(rect); 

        activeWordRequest = lastWord; 
        fetchTransliteration(lastWord).then(apiSuggestion => {
            if (apiSuggestion && activeWordRequest === lastWord) {
                currentSuggestions = Array.from(new Set([apiSuggestion, localSuggestion]));
                if(selectedIndex >= currentSuggestions.length) selectedIndex = 0;
                
                renderVSCodeSuggestion(currentSuggestions, selectedIndex);
                if (typeof positionSuggestionBox === 'function') positionSuggestionBox(rect); 
            }
        });

    } else {
        if (suggestionBox) suggestionBox.style.display = 'none';
        currentSuggestions = [];
        activeWordRequest = "";
    }
}, true);

// KEYBOARD SHORTCUTS
document.addEventListener('keydown', function(e) {
    // 1. Selection Replacement Mode
    if (typeof isSelectionMode !== 'undefined' && isSelectionMode && suggestionBox && suggestionBox.style.display === 'block' && selectionTranslation !== "") {
        if (e.code === 'Tab') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            document.execCommand('insertText', false, selectionTranslation);
            if (suggestionBox) suggestionBox.style.display = 'none';
            isSelectionMode = false;
            return;
        }
        if (e.code === 'Escape') {
            if (suggestionBox) suggestionBox.style.display = 'none';
            isSelectionMode = false;
            return;
        }
    }

    // 2. Typing Replacement Mode
    if ((typeof isSelectionMode === 'undefined' || !isSelectionMode) && suggestionBox && suggestionBox.style.display === 'block' && currentSuggestions.length > 0) {
        if (e.code === 'ArrowDown') {
            e.preventDefault(); 
            e.stopPropagation();           
            e.stopImmediatePropagation();  
            selectedIndex = (selectedIndex + 1) % currentSuggestions.length;
            renderVSCodeSuggestion(currentSuggestions, selectedIndex);
        }
        else if (e.code === 'ArrowUp') {
            e.preventDefault(); 
            e.stopPropagation();
            e.stopImmediatePropagation();
            selectedIndex = (selectedIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
            renderVSCodeSuggestion(currentSuggestions, selectedIndex);
        }
        else if (e.code === 'Tab') {
            e.preventDefault(); 
            e.stopPropagation();
            e.stopImmediatePropagation();
            replaceLastWord(lastCursorInfo, currentSuggestions[selectedIndex], true); 
        }
        else if (e.code === 'Space') {
            if (suggestionBox) suggestionBox.style.display = 'none';
            currentSuggestions = [];
            typedWordLength = 0;
            activeWordRequest = "";
        }
        else if (e.code === 'Escape') {
            if (suggestionBox) suggestionBox.style.display = 'none';
            currentSuggestions = [];
            typedWordLength = 0;
            activeWordRequest = "";
        }
    }
}, true);

// HANDLE MOUSE CLICK & HOVER
document.addEventListener('suggestionClicked', function(e) {
    let idx = e.detail.index;
    if (typeof isSelectionMode !== 'undefined' && isSelectionMode) {
        document.execCommand('insertText', false, selectionTranslation);
        if (suggestionBox) suggestionBox.style.display = 'none';
        isSelectionMode = false;
    } else {
        replaceLastWord(lastCursorInfo, currentSuggestions[idx], true);
    }
});

document.addEventListener('suggestionHovered', function(e) {
    let idx = e.detail.index;
    if (selectedIndex !== idx) {
        selectedIndex = idx;
        renderVSCodeSuggestion(currentSuggestions, selectedIndex);
    }
});