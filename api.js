// api.js - HANDLES ALL NETWORK REQUESTS

// Fetch Transliteration (Strictly returns ONLY ONE best word)
async function fetchTransliteration(word) {
    try {
        const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=bn-t-i0-und&num=3&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data[0] === "SUCCESS" && data[1] && data[1][0] && data[1][0][1]) {
            let rawSuggestions = data[1][0][1];
            
            // Filter out garbage (spaces or English letters)
            let cleanSuggestions = rawSuggestions.filter(sug => !sug.includes(" ") && !/[a-zA-Z]/.test(sug));
            
            // Return only the FIRST best valid phonetic word
            return cleanSuggestions.length > 0 ? cleanSuggestions[0] : null;
        }
    } catch (error) {
        console.error("Transliteration Error:", error);
    }
    return null;
}

// Helper function for sentence translation
function transliterateSentence(sentence) {
    let words = sentence.split(" ");
    let convertedWords = words.map(word => {
        if (/[a-zA-Z]/.test(word)) {
            return convertToBangla(word); 
        }
        return word;
    });
    return convertedWords.join(" ");
}

// Fetch sentence meaning for selected text
async function fetchSentenceTranslation(text) {
    try {
        let properBanglaText = transliterateSentence(text);
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=bn&tl=en&dt=t&q=${encodeURIComponent(properBanglaText)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data && data[0]) {
            return data[0].map(item => item[0]).join("").trim();
        }
    } catch (error) {
        console.error("Sentence Translation Error:", error);
    }
    return null;
}