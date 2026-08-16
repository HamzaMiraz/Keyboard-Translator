// popup.js - Handles UI Display, Settings Save, and Dynamic Key Fields (Hybrid)

document.addEventListener('DOMContentLoaded', function() {
    const mainPage = document.getElementById('mainPage');
    const settingsPage = document.getElementById('settingsPage');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const backBtn = document.getElementById('backBtn');
    
    const phoneticToggle = document.getElementById('phoneticToggle');
    const myLanguage = document.getElementById('myLanguage');
    const translationToggle = document.getElementById('translationToggle');
    const targetLanguage = document.getElementById('targetLanguage');
    
    const aiEngine = document.getElementById('aiEngine');
    const keys = ['groq', 'gemini']; // Only Groq and Gemini need API Keys
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    const status = document.getElementById('status');

    const phoneticSupportedLangs = ['bn', 'hi', 'ar', 'ru', 'ur', 'ja', 'zh-CN', 'ko']; 

    // STRICT Show/Hide Logic for 2-Page Design
    openSettingsBtn.addEventListener('click', () => { 
        mainPage.style.display = 'none';
        settingsPage.style.display = 'block';
    });
    
    backBtn.addEventListener('click', () => { 
        settingsPage.style.display = 'none';
        mainPage.style.display = 'block';
    });

    // Checks language and dynamically enables/disables phonetic toggle
    function updatePhoneticState() {
        if (phoneticSupportedLangs.includes(myLanguage.value)) {
            phoneticToggle.disabled = false;
            phoneticToggle.parentElement.style.opacity = "1"; 
        } else {
            phoneticToggle.checked = false;
            phoneticToggle.disabled = true;
            phoneticToggle.parentElement.style.opacity = "0.5"; 
        }
    }

    // Safely handles API Boxes so free models (like Google) show nothing
    function updateEngineUI() {
        const engine = aiEngine.value;
        
        // Hide all containers first
        document.querySelectorAll('.api-container').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show only if it's a specific engine that requires keys
        if (engine !== 'auto_fallback' && engine !== 'google') {
            const activeCont = document.getElementById(`cont-${engine}`);
            if (activeCont) {
                activeCont.style.display = 'block';
            }
        }
    }

    // Initialize UI on Load
    chrome.storage.local.get(null, function(data) {
        myLanguage.value = data.myLanguage || 'auto'; 
        targetLanguage.value = data.targetLanguage || 'en'; 
        aiEngine.value = data.aiEngine || 'auto_fallback'; 
        
        keys.forEach(k => {
            const inputId = `${k}ApiKey`;
            const el = document.getElementById(inputId);
            if(el) el.value = data[inputId] || '';
        });
        
        translationToggle.checked = data.translationEnabled !== false; 
        phoneticToggle.checked = data.phoneticEnabled !== false; 
        
        updatePhoneticState();
        updateEngineUI();
    });

    // Save Data Logic
    function autoSaveSettings() {
        let saveData = {
            phoneticEnabled: phoneticToggle.checked,
            myLanguage: myLanguage.value,
            translationEnabled: translationToggle.checked,
            targetLanguage: targetLanguage.value,
            aiEngine: aiEngine.value
        };
        keys.forEach(k => {
            const inputId = `${k}ApiKey`;
            const el = document.getElementById(inputId);
            if(el) saveData[inputId] = el.value.trim();
        });
        
        chrome.storage.local.set(saveData, function() {
            if(mainPage.style.display !== 'none') {
                status.style.opacity = '1';
                setTimeout(() => { status.style.opacity = '0'; }, 1000);
            }
        });
    }

    // Event Listeners for Saving and Updating
    [phoneticToggle, translationToggle, targetLanguage].forEach(el => el.addEventListener('change', autoSaveSettings));
    
    myLanguage.addEventListener('change', () => {
        updatePhoneticState();
        autoSaveSettings();
    });
    
    aiEngine.addEventListener('change', () => {
        updateEngineUI();
        autoSaveSettings();
    });

    keys.forEach(k => {
        const inputId = `${k}ApiKey`;
        const el = document.getElementById(inputId);
        if(el) el.addEventListener('input', autoSaveSettings);
    });

    // Clear Cache Action
    clearCacheBtn.addEventListener('click', function() {
        chrome.storage.local.remove(['PhoneticCache', 'TranslationCache'], function() {
            clearCacheBtn.innerText = "Memory Cleared!";
            clearCacheBtn.style.background = "#4CAF50"; 
            setTimeout(() => { clearCacheBtn.innerText = "Clear Cache Memory"; clearCacheBtn.style.background = "#e53935"; }, 2000);
        });
    });
});