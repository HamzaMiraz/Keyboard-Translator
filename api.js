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

// 3. INLINE TRANSLATION API
async function fetchSentenceTranslation(text) {
    let lang = window.SmartSettings.translationLangCode;
    let url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
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