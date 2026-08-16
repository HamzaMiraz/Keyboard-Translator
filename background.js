// background.js - Hybrid Network Handler with Auto Fallback & Specific Errors



const LANGUAGE_NAMES = {

    'auto': 'Automatic Detection', 'en': 'English', 'bn': 'Bengali', 'hi': 'Hindi',

    'ar': 'Arabic', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'ja': 'Japanese',

    'zh-CN': 'Chinese (Simplified)', 'ru': 'Russian', 'pt': 'Portuguese',

    'it': 'Italian', 'ko': 'Korean', 'ur': 'Urdu', 'tr': 'Turkish'

};



const PHONETIC_SUPPORTED = ['bn', 'hi', 'ar', 'ru', 'ur', 'ja', 'zh-CN', 'ko'];



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === "translate") {

        handleTranslation(request)

            .then(sendResponse)

            .catch(err => sendResponse({ success: false, error: err.toString() }));

        return true;

    }

});



// Helper Function: Chrome Built-in Local AI (Offline Translation)

async function fallbackToLocalTranslation(text, sourceLang, targetLang) {

    try {

        const sl = (sourceLang === 'auto') ? 'en' : sourceLang;

        const tl = targetLang;



        if (!self.translation) {

            throw new Error("Chrome Local AI not enabled.");

        }



        const canTranslate = await self.translation.canTranslate({ sourceLanguage: sl, targetLanguage: tl });

        if (canTranslate !== 'no') {

            const translator = await self.translation.createTranslator({ sourceLanguage: sl, targetLanguage: tl });

            const result = await translator.translate(text);

            return { success: true, translation: result + " ⚡ (Offline)" };

        } else {

            throw new Error(`Language pair ${sl} to ${tl} not supported offline yet.`);

        }

    } catch (error) {

        return { success: false, error: "Offline Fallback Failed: " + error.message };

    }

}



// Model Execute Helpers

async function runGoogle(text, sourceLang, targetLang) {

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url);

    const json = await res.json();

    if (json && json[0] && json[0][0]) {

        return json[0].map(item => item[0]).join('');

    }

    throw new Error("Google Translate API blocked or limit reached.");

}



async function runGemini(text, sourceLang, targetLang, apiKey, systemPrompt) {

    if (!apiKey) throw new Error("Gemini API Key is missing. Please add it in settings.");

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const payload = { contents: [{ parts: [{ text: systemPrompt }, { text: `Text to translate: "${text}"` }] }], generationConfig: { temperature: 0.1 } };

    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

    const json = await res.json();

    if (json.error) throw new Error("Gemini API Error: " + json.error.message);

    return json.candidates[0].content.parts[0].text.trim();

}



async function runGroq(text, sourceLang, targetLang, apiKey, systemPrompt) {

    if (!apiKey) throw new Error("Groq API Key is missing. Please add it in settings.");

    const endpoint = `https://api.groq.com/openai/v1/chat/completions`;

    const payload = { model: "llama-3.1-8b-instant", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Text to translate: "${text}"` }], temperature: 0.1 };

    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify(payload) });

    const json = await res.json();

    if (json.error) throw new Error("Groq API Error: " + json.error.message);

    return json.choices[0].message.content.trim();

}





async function handleTranslation(data) {

    const { text, sourceLang, targetLang, engine, geminiApiKey, groqApiKey } = data;

    let textToTranslate = text;

    const hasEnglishAlphabets = /[a-zA-Z]/.test(text);



    // 1. UNIVERSAL SMART PIPELINE

    if (hasEnglishAlphabets && PHONETIC_SUPPORTED.includes(sourceLang)) {

        const translitUrl = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${sourceLang}-t-i0-und&num=1`;

        try {

            const tRes = await fetch(translitUrl);

            const tData = await tRes.json();

            if (tData[0] === 'SUCCESS' && tData[1]) {

                textToTranslate = tData[1].map(item => item[1][0]).join('');

            }

        } catch (e) {

            console.warn("Smart Pipeline skipped (Likely offline):", e.message);

        }

    }



    let primaryResult = null;

    let primaryError = null;



    // 2. PRIMARY ONLINE ENGINES

    if (navigator.onLine) {

        const systemPrompt = `You are a professional translator. \nTranslate the text from '${LANGUAGE_NAMES[sourceLang] || sourceLang}' to '${LANGUAGE_NAMES[targetLang] || targetLang}'.\nContext-Aware Rule: Handle code-switching or mixed language seamlessly.\nReturn ONLY the translation. No quotes, notes, or explanations.`;



        try {

            if (engine === 'auto_fallback') {

                // Route 1: Auto Fallback (Google -> Gemini -> Groq)

                try {

                    primaryResult = { success: true, translation: await runGoogle(textToTranslate, sourceLang, targetLang) };

                } catch (eGoogle) {

                    try {

                        primaryResult = { success: true, translation: await runGemini(textToTranslate, sourceLang, targetLang, geminiApiKey, systemPrompt) };

                    } catch (eGemini) {

                        try {

                            primaryResult = { success: true, translation: await runGroq(textToTranslate, sourceLang, targetLang, groqApiKey, systemPrompt) };

                        } catch (eGroq) {

                            throw new Error("Auto Fallback failed: All translation engines are unavailable or missing keys.");

                        }

                    }

                }

            } else if (engine === 'google') {

                // Route 2: Specific Engines (No Fallback)

                primaryResult = { success: true, translation: await runGoogle(textToTranslate, sourceLang, targetLang) };

            } else if (engine === 'gemini') {

                primaryResult = { success: true, translation: await runGemini(textToTranslate, sourceLang, targetLang, geminiApiKey, systemPrompt) };

            } else if (engine === 'groq') {

                primaryResult = { success: true, translation: await runGroq(textToTranslate, sourceLang, targetLang, groqApiKey, systemPrompt) };

            }

        } catch (error) {

            primaryError = error.message;

        }

    } else {

        primaryError = "No Internet Connection.";

    }



    if (primaryResult && primaryResult.success) {

        return primaryResult;

    }



    // 3. OFFLINE FALLBACK ENGINE

    console.warn(`Primary Engine Failed (${primaryError}). Trying Local Offline AI...`);

    const offlineResult = await fallbackToLocalTranslation(textToTranslate, sourceLang, targetLang);

   

    if (offlineResult && offlineResult.success) {

        return offlineResult;

    }



    return { success: false, error: `${primaryError}` };

}