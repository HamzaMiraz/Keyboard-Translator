// engine.js - OFFLINE PHONETIC ENGINE

function convertToBangla(engWord) {
    let out = engWord;

    out = out.replace(/ia/g, 'iya');
    out = out.replace(/ua/g, 'uwa');

    const multiConsonants = {
        'kh': 'খ', 'gh': 'ঘ', 'ch': 'ছ', 'jh': 'ঝ', 
        'th': 'থ', 'dh': 'ধ', 'ph': 'ফ', 'bh': 'ভ', 
        'sh': 'শ', 'ng': 'ং'
    };
    for (let eng in multiConsonants) {
        out = out.split(eng).join(multiConsonants[eng]);
    }

    const singleConsonants = {
        'k': 'ক', 'g': 'গ', 'c': 'চ', 'j': 'জ', 'T': 'ট', 'D': 'ড',
        't': 'ত', 'd': 'দ', 'n': 'ন', 'p': 'প', 'f': 'ফ', 'b': 'ব', 
        'v': 'ভ', 'm': 'ম', 'r': 'র', 'l': 'ল', 's': 'স', 'h': 'হ', 
        'y': 'য়', 'z': 'য', 'w': 'ও'
    };
    for (let eng in singleConsonants) {
        out = out.split(eng).join(singleConsonants[eng]);
    }

    const banglaConsonants = 'কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ং';
    const kars = {
        'oi': 'ৈ', 'ou': 'ৌ', 'a': 'া', 'i': 'ি', 'I': 'ী', 
        'u': 'ু', 'U': 'ূ', 'e': 'ে', 'O': 'ো', 'o': '' 
    };
    
    for (let eng in kars) {
        let kar = kars[eng];
        let regex = new RegExp(`([${banglaConsonants}])${eng}`, 'g');
        out = out.replace(regex, `$1${kar}`);
    }

    const indVowels = {
        'oi': 'ঐ', 'ou': 'ঔ', 'a': 'আ', 'i': 'ই', 'I': 'ঈ', 
        'u': 'উ', 'U': 'ঊ', 'e': 'এ', 'O': 'ও', 'o': 'অ'
    };
    for (let eng in indVowels) {
        out = out.split(eng).join(indVowels[eng]);
    }

    return out;
}