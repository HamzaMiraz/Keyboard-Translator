// api.js - NETWORK REQUESTS, STATE MANAGER & SMART CACHE ENGINE

// 1. GLOBAL SETTINGS
window.SmartSettings = {
    phoneticEnabled: true,
    phoneticLangCode: 'bn',
    translationEnabled: true,
    translationLangCode: 'en'
};

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

// 2. SMART CACHE ENGINE (Zero-RAM Auto-Cleaning)
window.PhoneticCache = {};
window.TranslationCache = {};
const MAX_CACHE_SIZE = 10000; // Maximum words to keep in RAM

// Function to auto-clean old cache when limit is reached
function manageCacheSize(cacheObj) {
    let keys = Object.keys(cacheObj);
    if (keys.length > MAX_CACHE_SIZE) {
        // Delete the oldest 5000 entries to free up RAM instantly
        for (let i = 0; i < MAX_CACHE_SIZE / 2; i++) {
            delete cacheObj[keys[i]];
        }
    }
}

// 3. DYNAMIC PHONETIC API (With Caching)
async function fetchTransliteration(word) {
    let lang = window.SmartSettings.phoneticLangCode;
    let cacheKey = `${lang}_${word.toLowerCase()}`;

    // CACHE CHECK: If word exists, return instantly (0 API Request!)
    if (window.PhoneticCache[cacheKey]) {
        return window.PhoneticCache[cacheKey];
    }

    let url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=${lang}-t-i0-und&num=1`;
    try {
        let res = await fetch(url);
        let data = await res.json();
        if (data[0] === 'SUCCESS' && data[1][0] && data[1][0][1]) {
            let result = data[1][0][1][0];
            
            // Save to Cache & Manage RAM
            window.PhoneticCache[cacheKey] = result;
            manageCacheSize(window.PhoneticCache);
            
            return result;
        }
    } catch (e) {
        console.error("Phonetic Error:", e);
    }
    return null;
}

// 4. INLINE TRANSLATION API (With Caching & Smart Pipeline)
async function fetchSentenceTranslation(text) {
    let targetLang = window.SmartSettings.translationLangCode;
    let textToTranslate = text;
    
    // Create a unique key for the sentence
    let cacheKey = `${targetLang}_${text.trim().toLowerCase()}`;

    // CACHE CHECK: If sentence was translated before, return instantly
    if (window.TranslationCache[cacheKey]) {
        return window.TranslationCache[cacheKey];
    }

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

    let url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
    try {
        let res = await fetch(url);
        let data = await res.json();
        if (data && data[0] && data[0][0]) {
            let result = data[0].map(item => item[0]).join('');
            
            // Save to Cache & Manage RAM
            window.TranslationCache[cacheKey] = result;
            manageCacheSize(window.TranslationCache);
            
            return result;
        }
    } catch (e) {
        console.error("Translation Error:", e);
    }
    return null;
}
