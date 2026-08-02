// api.js - NETWORK REQUESTS & SILENT STATE MANAGER

// 1. GLOBAL SETTINGS (Always available instantly)
window.SmartSettings = {
    phoneticEnabled: true,
    phoneticLangCode: 'bn',
    translationEnabled: true,
    translationLangCode: 'en'
};

// Keep settings synced silently in the background
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['phoneticEnabled', 'phoneticLangCode', 'translationEnabled', 'translationLangCode'], function(res) {
        if (res.phoneticEnabled !== undefined) window.SmartSettings.phoneticEnabled = res.phoneticEnabled;
        if (res.phoneticLangCode !== undefined) window.SmartSettings.phoneticLangCode = res.phoneticLangCode;
        if (res.translationEnabled !== undefined) window.SmartSettings.translationEnabled = res.translationEnabled;
        if (res.translationLangCode !== undefined) window.SmartSettings.translationLangCode = res.translationLangCode;
    });

    chrome.storage.onChanged.addListener(function(changes) {
        if (changes.phoneticEnabled) window.SmartSettings.phoneticEnabled = changes.phoneticEnabled.newValue;
        if (changes.phoneticLangCode) window.SmartSettings.phoneticLangCode = changes.phoneticLangCode.newValue;
        if (changes.translationEnabled) window.SmartSettings.translationEnabled = changes.translationEnabled.newValue;
        if (changes.translationLangCode) window.SmartSettings.translationLangCode = changes.translationLangCode.newValue;
    });
}

// 2. DYNAMIC PHONETIC API
async function fetchTransliteration(word) {
    let lang = window.SmartSettings.phoneticLangCode;
    let url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=${lang}-t-i0-und&num=1`;
    try {
        let res = await fetch(url);
        let data = await res.json();
        if (data[0] === 'SUCCESS' && data[1][0] && data[1][0][1]) {
            return data[1][0][1][0];
        }
    } catch (e) {
        console.error("Phonetic Error:", e);
    }
    return null;
}

// 3. INLINE TRANSLATION API (Restored Mixed-Language Support)
// 3. INLINE TRANSLATION API (Decoupled & Independent Pipeline)// phonetic and translation are now independent, so you can turn off phonetic typing but still get perfect translations for Banglish/Hinglish text.
async function fetchSentenceTranslation(text) {
    let targetLang = window.SmartSettings.translationLangCode;
    let textToTranslate = text;

    // FIX: Removed the 'phoneticEnabled' condition.
    // Now it ALWAYS pre-processes the selected text based on your native language code,
    // so Banglish/Hinglish will always translate perfectly even if typing is turned off!
    let phoneticLang = window.SmartSettings.phoneticLangCode || 'bn';
    let translitUrl = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${phoneticLang}-t-i0-und&num=1`;
    
    try {
        let tRes = await fetch(translitUrl);
        let tData = await tRes.json();
        if (tData[0] === 'SUCCESS' && tData[1]) {
            textToTranslate = tData[1].map(item => item[1][0]).join('');
        }
    } catch (e) {
        console.error("Smart Pipeline Error:", e);
    }

    // Send the processed text to Google Translate
    let url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
    try {
        let res = await fetch(url);
        let data = await res.json();
        if (data && data[0] && data[0][0]) {
            return data[0].map(item => item[0]).join('');
        }
    } catch (e) {
        console.error("Translation Error:", e);
    }
    return null;
}