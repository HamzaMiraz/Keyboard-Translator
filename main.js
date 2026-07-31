// main.js - V4: INSTANT TYPING + SENTENCE SELECTION TRANSLATOR

let currentSuggestion = "";
let typedWordLength = 0;
let lastCursorInfo = null;
let activeWordRequest = ""; 

// New State for Sentence Translation
let isSelectionMode = false;
let selectionTranslation = "";

// -------------------------------------------------------------
// 1. API CALLS
// -------------------------------------------------------------

// Fetch dictionary meaning for single typing words (English to Bangla)
async function fetchDictionaryMeaning(word) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&q=${encodeURIComponent(word)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
            const translated = data[0][0][0].trim();
            if (translated.toLowerCase() !== word.toLowerCase() && !/[a-zA-Z]/.test(translated)) {
                return translated;
            }
        }
    } catch (error) {}
    return null;
}

// Fetch sentence meaning for selected text (Auto-Detect to English)
async function fetchSentenceTranslation(text) {
    try {
        // sl=auto (Auto Detect Language like Bangla/Banglish), tl=en (English)
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data[0]) {
            // Combine all sentence parts
            let fullTranslation = data[0].map(item => item[0]).join("");
            return fullTranslation.trim();
        }
    } catch (error) {}
    return null;
}

// -------------------------------------------------------------
// 2. CURSOR & REPLACEMENT LOGIC
// -------------------------------------------------------------

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
    let replacement = newWord + (addSpace ? " " : "");
    if (info.type === 'standard') {
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
    suggestionBox.style.display = 'none';
    currentSuggestion = "";
    typedWordLength = 0;
}

// -------------------------------------------------------------
// 3. SELECTION LOGIC (NEW FEATURE)
// -------------------------------------------------------------

function handleTextSelection() {
    let sel = window.getSelection();
    let text = sel.toString().trim();
    
    // If user selected text longer than 1 character
    if (text.length > 1) {
        isSelectionMode = true;
        
        // Show loading state
        renderVSCodeSuggestion("Translating to English...");
        let rect = sel.getRangeAt(0).getBoundingClientRect();
        suggestionBox.style.top = (window.scrollY + rect.bottom + 8) + 'px';
        suggestionBox.style.left = (window.scrollX + rect.left) + 'px';
        suggestionBox.style.display = 'block';

        // Fetch English Translation
        fetchSentenceTranslation(text).then(translation => {
            // Make sure the user hasn't un-selected while loading
            if (translation && isSelectionMode && sel.toString().trim() === text) {
                selectionTranslation = translation;
                renderVSCodeSuggestion(translation);
            }
        });
    } else {
        // If selection is cleared, hide the box
        if (isSelectionMode) {
            isSelectionMode = false;
            selectionTranslation = "";
            suggestionBox.style.display = 'none';
        }
    }
}

// Trigger selection logic when mouse is released or Shift+Arrow keys are used
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', (e) => {
    if (e.shiftKey && e.code.includes('Arrow')) {
        handleTextSelection();
    }
});

// -------------------------------------------------------------
// 4. TYPING LOGIC (V3 FEATURE)
// -------------------------------------------------------------

document.addEventListener('keyup', function(e) {
    if (e.code === 'Tab' || e.code === 'Space') return;
    
    // Disable typing logic if text is currently highlighted
    if (isSelectionMode) return; 

    let info = getCursorInfo();
    if (!info) {
        if (suggestionBox) suggestionBox.style.display = 'none';
        return;
    }

    let words = info.text.split(/[\s\n]+/);
    let lastWord = words[words.length - 1];
    
    if (lastWord.trim() !== "" && /^[a-zA-Z]+$/.test(lastWord)) {
        
        // INSTANT OFFLINE RENDER
        let instantLocalSuggestion = convertToBangla(lastWord);
        currentSuggestion = instantLocalSuggestion;
        typedWordLength = lastWord.length;
        lastCursorInfo = info;
        
        let rect = info.element.getBoundingClientRect();
        suggestionBox.style.top = (window.scrollY + rect.bottom + 4) + 'px';
        suggestionBox.style.left = (window.scrollX + rect.left + 4) + 'px';
        
        renderVSCodeSuggestion(currentSuggestion);
        suggestionBox.style.display = 'block';

        // BACKGROUND API UPGRADE
        activeWordRequest = lastWord; 
        fetchDictionaryMeaning(lastWord).then(dictionaryWord => {
            if (dictionaryWord && activeWordRequest === lastWord) {
                currentSuggestion = dictionaryWord;
                renderVSCodeSuggestion(currentSuggestion);
            }
        });
    } else {
        if (suggestionBox) suggestionBox.style.display = 'none';
        currentSuggestion = "";
        activeWordRequest = "";
    }
}, true);

// -------------------------------------------------------------
// 5. KEYBOARD CONTROLS (TAB / SPACE)
// -------------------------------------------------------------

document.addEventListener('keydown', function(e) {
    // A. Handle Tab for SELECTION REPLACEMENT
    if (isSelectionMode && suggestionBox.style.display === 'block' && selectionTranslation !== "") {
        if (e.code === 'Tab') {
            e.preventDefault();
            e.stopPropagation();
            
            // Replace highlighted text with English translation using native browser command
            document.execCommand('insertText', false, selectionTranslation);
            
            // Reset states
            suggestionBox.style.display = 'none';
            isSelectionMode = false;
            selectionTranslation = "";
            return;
        }
        if (e.code === 'Escape') {
            suggestionBox.style.display = 'none';
            isSelectionMode = false;
            return;
        }
    }

    // B. Handle Tab/Space for TYPING REPLACEMENT
    if (!isSelectionMode && suggestionBox && suggestionBox.style.display === 'block' && currentSuggestion !== "") {
        if (e.code === 'Tab') {
            e.preventDefault(); 
            e.stopPropagation();
            replaceLastWord(lastCursorInfo, currentSuggestion, true); 
        }
        else if (e.code === 'Space') {
            suggestionBox.style.display = 'none';
            currentSuggestion = "";
            typedWordLength = 0;
            activeWordRequest = "";
        }
        else if (e.code === 'Escape') {
            suggestionBox.style.display = 'none';
            currentSuggestion = "";
            typedWordLength = 0;
            activeWordRequest = "";
        }
    }
}, true);

createSuggestionBox();