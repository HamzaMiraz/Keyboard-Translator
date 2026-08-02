// popup.js - HANDLES SETTINGS AND STORAGE

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM Elements
    const phoneticToggle = document.getElementById('phoneticToggle');
    const phoneticLang = document.getElementById('phoneticLang');
    
    const translationToggle = document.getElementById('translationToggle');
    const translationLang = document.getElementById('translationLang');

    // 2. Load saved settings from Chrome Storage
    chrome.storage.local.get({
        // Set Default Values
        phoneticEnabled: true,
        phoneticLangCode: 'bn',
        translationEnabled: true,
        translationLangCode: 'en'
    }, (settings) => {
        // Apply settings to the UI
        phoneticToggle.checked = settings.phoneticEnabled;
        phoneticLang.value = settings.phoneticLangCode;
        
        translationToggle.checked = settings.translationEnabled;
        translationLang.value = settings.translationLangCode;
    });

    // 3. Save settings instantly when user changes anything
    phoneticToggle.addEventListener('change', () => {
        chrome.storage.local.set({ phoneticEnabled: phoneticToggle.checked });
    });

    phoneticLang.addEventListener('change', () => {
        chrome.storage.local.set({ phoneticLangCode: phoneticLang.value });
    });

    translationToggle.addEventListener('change', () => {
        chrome.storage.local.set({ translationEnabled: translationToggle.checked });
    });

    translationLang.addEventListener('change', () => {
        chrome.storage.local.set({ translationLangCode: translationLang.value });
    });
});