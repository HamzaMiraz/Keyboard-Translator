// main.js - CORE TYPING AND KEYBOARD EVENTS

// Fully integrated with Zero-RAM SmartSettings and Context-Aware SmartAPI.



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

   

    if (typeof suggestionBox !== 'undefined' && suggestionBox) suggestionBox.style.display = 'none';

    currentSuggestions = [];

    selectedIndex = 0;

    typedWordLength = 0;

}



// TYPING LOGIC (100% Synchronous and Delay-Free)

document.addEventListener('keyup', function(e) {

    if (e.code === 'Tab' || e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'ArrowUp') return;

    if (typeof isSelectionMode !== 'undefined' && isSelectionMode) return;



    // Stop if Phonetic is OFF in settings

    if (window.SmartSettings && window.SmartSettings.phoneticEnabled === false) {

        if (typeof suggestionBox !== 'undefined' && suggestionBox) suggestionBox.style.display = 'none';

        currentSuggestions = [];

        activeWordRequest = "";

        return;

    }



    let info = getCursorInfo();

    if (!info) {

        if (typeof suggestionBox !== 'undefined' && suggestionBox) suggestionBox.style.display = 'none';

        return;

    }



    let words = info.text.split(/[\s\n]+/);

    let lastWord = words[words.length - 1];

   

    if (lastWord.trim() !== "" && /^[a-zA-Z]+$/.test(lastWord)) {

       

        let localSuggestion = null;

       

        let currentLang = (window.SmartSettings && window.SmartSettings.myLanguage) ? window.SmartSettings.myLanguage : 'bn';

       

        // Dynamically route to the Universal Offline Engine

        if (typeof convertPhoneticLocal === 'function') {

            localSuggestion = convertPhoneticLocal(lastWord, currentLang);

        }



        if (localSuggestion) {

            currentSuggestions = [localSuggestion];

        } else {

            currentSuggestions = ["..."]; // Shows dots if offline engine doesn't support the language yet

        }

       

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

       

        if (typeof renderVSCodeSuggestion === 'function') renderVSCodeSuggestion(currentSuggestions, selectedIndex);

        if (typeof positionSuggestionBox === 'function') positionSuggestionBox(rect);



        activeWordRequest = lastWord;

       

        // NEW API INTEGRATION: Fetch Transliteration dynamically passing 'myLanguage'

        if (window.SmartAPI && window.SmartAPI.fetchTransliteration && window.SmartSettings) {

            const langCode = window.SmartSettings.myLanguage || 'bn';

           

            window.SmartAPI.fetchTransliteration(lastWord, langCode).then(apiSuggestion => {

                if (apiSuggestion && activeWordRequest === lastWord) {

                    if (localSuggestion) {

                        currentSuggestions = Array.from(new Set([apiSuggestion, localSuggestion]));

                    } else {

                        currentSuggestions = [apiSuggestion];

                    }

                   

                    if(selectedIndex >= currentSuggestions.length) selectedIndex = 0;

                   

                    if (typeof renderVSCodeSuggestion === 'function') renderVSCodeSuggestion(currentSuggestions, selectedIndex);

                    if (typeof positionSuggestionBox === 'function') positionSuggestionBox(rect);

                }

            });

        }



    } else {

        if (typeof suggestionBox !== 'undefined' && suggestionBox) suggestionBox.style.display = 'none';

        currentSuggestions = [];

        activeWordRequest = "";

    }

}, true);



// KEYBOARD SHORTCUTS

document.addEventListener('keydown', function(e) {

    if (typeof isSelectionMode !== 'undefined' && isSelectionMode && typeof suggestionBox !== 'undefined' && suggestionBox && suggestionBox.style.display === 'block' && typeof selectionTranslation !== 'undefined' && selectionTranslation !== "") {

        if (e.code === 'Tab') {

            e.preventDefault();

            e.stopPropagation();

            e.stopImmediatePropagation();

            document.execCommand('insertText', false, selectionTranslation);

            if (typeof suggestionBox !== 'undefined' && suggestionBox) suggestionBox.style.display = 'none';

            isSelectionMode = false;

            return;

        }

        if (e.code === 'Escape') {

            if (typeof suggestionBox !== 'undefined' && suggestionBox) suggestionBox.style.display = 'none';

            isSelectionMode = false;

            return;

        }

    }



    if ((typeof isSelectionMode === 'undefined' || !isSelectionMode) && typeof suggestionBox !== 'undefined' && suggestionBox && suggestionBox.style.display === 'block' && currentSuggestions.length > 0) {

        if (e.code === 'ArrowDown') {

            e.preventDefault();

            e.stopPropagation();          

            e.stopImmediatePropagation();  

            selectedIndex = (selectedIndex + 1) % currentSuggestions.length;

            if (typeof renderVSCodeSuggestion === 'function') renderVSCodeSuggestion(currentSuggestions, selectedIndex);

        }

        else if (e.code === 'ArrowUp') {

            e.preventDefault();

            e.stopPropagation();

            e.stopImmediatePropagation();

            selectedIndex = (selectedIndex - 1 + currentSuggestions.length) % currentSuggestions.length;

            if (typeof renderVSCodeSuggestion === 'function') renderVSCodeSuggestion(currentSuggestions, selectedIndex);

        }

        else if (e.code === 'Tab') {

            e.preventDefault();

            e.stopPropagation();

            e.stopImmediatePropagation();

            replaceLastWord(lastCursorInfo, currentSuggestions[selectedIndex], true);

        }

        else if (e.code === 'Space') {

            if (typeof suggestionBox !== 'undefined' && suggestionBox) suggestionBox.style.display = 'none';

            currentSuggestions = [];

            typedWordLength = 0;

            activeWordRequest = "";

        }

        else if (e.code === 'Escape') {

            if (typeof suggestionBox !== 'undefined' && suggestionBox) suggestionBox.style.display = 'none';

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

        if (typeof suggestionBox !== 'undefined' && suggestionBox) suggestionBox.style.display = 'none';

        isSelectionMode = false;

    } else {

        replaceLastWord(lastCursorInfo, currentSuggestions[idx], true);

    }

});



document.addEventListener('suggestionHovered', function(e) {

    let idx = e.detail.index;

    if (selectedIndex !== idx) {

        selectedIndex = idx;

        if (typeof renderVSCodeSuggestion === 'function') renderVSCodeSuggestion(currentSuggestions, selectedIndex);

    }

});

// =========================================================================
// HIDE SUGGESTION BOX ON OUTSIDE CLICK OR TAB SWITCH (UX FIX)
// =========================================================================

// 1. Handle Mouse Clicks Outside the Input Box
document.addEventListener('mousedown', function(event) {
    // Check if suggestion box exists and is currently visible
    if (typeof suggestionBox !== 'undefined' && suggestionBox && suggestionBox.style.display === 'block') {
        
        // If the user clicks anywhere OUTSIDE the suggestion box itself
        if (!suggestionBox.contains(event.target)) {
            suggestionBox.style.display = 'none'; // Hide the box
            currentSuggestions = [];              // Clear memory
            typedWordLength = 0;                  // Reset word length
            activeWordRequest = "";               // Clear active request
        }
    }
});

// // 2. Handle Tab Switching or Window Losing Focus
// window.addEventListener('blur', function() {
//     // If the user changes tabs or minimizes the browser, hide the box safely
//     if (typeof suggestionBox !== 'undefined' && suggestionBox && suggestionBox.style.display === 'block') {
//         suggestionBox.style.display = 'none';
//         currentSuggestions = [];
//         typedWordLength = 0;
//         activeWordRequest = "";
//     }
// });