 /**

 * api.js - Core Network, Persistent State Manager & Hybrid API Engine

 * Feature: LFU-LRU Cache Eviction (Least Frequently Used + Least Recently Used)

 */



window.SmartSettings = {

    phoneticEnabled: true,

    myLanguage: 'bn',

    targetLanguage: 'en',

    aiEngine: 'auto_fallback',

    geminiApiKey: '',

    groqApiKey: ''

};



// 4.5 MB limit in bytes

const CACHE_BYTE_LIMIT = 4.5 * 1024 * 1024;

window.PhoneticCache = {};

window.TranslationCache = {};



// 1. LOAD SETTINGS & PERSISTENT CACHE ON BOOT

chrome.storage.local.get(null, function(data) {

    Object.assign(window.SmartSettings, data);

   

    if (data.PhoneticCache) window.PhoneticCache = data.PhoneticCache;

    if (data.TranslationCache) window.TranslationCache = data.TranslationCache;

});



// 2. LISTEN FOR SETTINGS CHANGES & MANUAL CACHE CLEARS

chrome.storage.onChanged.addListener(function(changes, namespace) {

    if (namespace === 'local') {

        for (let [key, { newValue }] of Object.entries(changes)) {

            if (key === 'PhoneticCache' || key === 'TranslationCache') {

                if (!newValue) {

                    if (key === 'PhoneticCache') window.PhoneticCache = {};

                    if (key === 'TranslationCache') window.TranslationCache = {};

                }

            } else {

                window.SmartSettings[key] = newValue;

            }

        }

    }

});



// 3. SMART CACHE MANAGER (LFU + LRU Eviction Logic)

function manageCacheSize(cacheObj, cacheName) {

    let cacheString = JSON.stringify(cacheObj);

   

    if (cacheString.length > CACHE_BYTE_LIMIT) {

        let keys = Object.keys(cacheObj);

       

        // Advanced Sorting: Least Frequently Used (count), tie-broken by Least Recently Used (time)

        keys.sort((a, b) => {

            let objA = cacheObj[a];

            let objB = cacheObj[b];

           

            // Fallback for old string-only cache data (treat as count 1, old time)

            let countA = typeof objA === 'object' ? objA.count : 1;

            let countB = typeof objB === 'object' ? objB.count : 1;

            let timeA = typeof objA === 'object' ? objA.time : 0;

            let timeB = typeof objB === 'object' ? objB.time : 0;

           

            if (countA !== countB) {

                return countA - countB; // Sort by usage count (Lowest first)

            }

            return timeA - timeB; // If counts are equal, sort by oldest time first

        });

       

        // Delete the 10% most useless entries

        let deleteCount = Math.max(1, Math.floor(keys.length * 0.1));

        for (let i = 0; i < deleteCount; i++) {

            delete cacheObj[keys[i]];

        }

    }

   

    // Save to permanent storage

    let saveData = {};

    saveData[cacheName] = cacheObj;

    chrome.storage.local.set(saveData);

}



// Helper Function: Updates Cache Hit Count and Time

function processCacheHit(cacheObj, cacheKey, cacheName) {

    let item = cacheObj[cacheKey];

   

    // Upgrade old string data to new object format if necessary

    if (typeof item === 'string') {

        item = { text: item, count: 1, time: Date.now() };

    } else {

        item.count += 1; // Increase usage count

        item.time = Date.now(); // Update last used time

    }

   

    cacheObj[cacheKey] = item;

   

    // Async save to storage so it doesn't block the UI

    let saveData = {};

    saveData[cacheName] = cacheObj;

    chrome.storage.local.set(saveData);

   

    return item.text;

}



// 4. PHONETIC API

async function fetchTransliteration(word) {

    let langCode = window.SmartSettings.myLanguage || 'bn';

    if (!word || langCode === 'en' || langCode === 'auto') return word;

   

    const cacheKey = `${langCode}_${word.toLowerCase()}`;

   

    // CACHE HIT - 0ms Return

    if (window.PhoneticCache[cacheKey]) {

        return processCacheHit(window.PhoneticCache, cacheKey, 'PhoneticCache');

    }



    try {

        const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=${langCode}-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test`;

        const response = await fetch(url);

        const data = await response.json();



        if (data[0] === 'SUCCESS' && data[1][0][1] && data[1][0][1].length > 0) {

            const result = data[1][0][1][0];

            // Save new item with format {text, count, time}

            window.PhoneticCache[cacheKey] = { text: result, count: 1, time: Date.now() };

            manageCacheSize(window.PhoneticCache, 'PhoneticCache');

            return result;

        }

    } catch (error) {

        console.error("Phonetic API Error:", error);

    }

   

    return word;

}



// 5. TRANSLATION API

async function fetchSentenceTranslation(text) {

    if (!text.trim()) return text;

   

    const { myLanguage, targetLanguage, aiEngine, geminiApiKey, groqApiKey } = window.SmartSettings;

    const cacheKey = `${myLanguage}_${targetLanguage}_${text.trim().toLowerCase()}`;

   

    // CACHE HIT - 0ms Return

    if (window.TranslationCache[cacheKey]) {

        return processCacheHit(window.TranslationCache, cacheKey, 'TranslationCache');

    }



    return new Promise((resolve) => {

        chrome.runtime.sendMessage({

            action: "translate",

            text: text,

            sourceLang: myLanguage,

            targetLang: targetLanguage,

            engine: aiEngine,

            geminiApiKey: geminiApiKey,

            groqApiKey: groqApiKey

        }, (response) => {

            if (chrome.runtime.lastError) {

                console.error("Extension Error:", chrome.runtime.lastError);

                resolve("⚠️ Error: Extension disconnected. Please HARD REFRESH.");

                return;

            }

            if (response && response.success) {

                // Save new item with format {text, count, time}

                window.TranslationCache[cacheKey] = { text: response.translation, count: 1, time: Date.now() };

                manageCacheSize(window.TranslationCache, 'TranslationCache');

                resolve(response.translation);

            } else {

                resolve(`⚠️ Error: ${response ? response.error : "Translation failed"}`);

            }

        });

    });

}



window.fetchTransliteration = fetchTransliteration;

window.fetchSentenceTranslation = fetchSentenceTranslation;

window.SmartAPI = { fetchTransliteration, fetchSentenceTranslation };