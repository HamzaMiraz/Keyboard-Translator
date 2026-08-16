// engine.js - OFFLINE PHONETIC ENGINE (Multi-Language Rule-Based)



function convertPhoneticLocal(engWord, langCode) {

    if (!engWord) return null;

    let out = engWord.toLowerCase();



    // 1. BENGALI (বাংলা)

    if (langCode === 'bn') {

        out = engWord; // Keep case for specific rules

        out = out.replace(/ia/g, 'iya').replace(/ua/g, 'uwa');

        const multi = { 'kh': 'খ', 'gh': 'ঘ', 'ch': 'ছ', 'jh': 'ঝ', 'th': 'থ', 'dh': 'ধ', 'ph': 'ফ', 'bh': 'ভ', 'sh': 'শ', 'ng': 'ং' };

        for (let e in multi) out = out.split(e).join(multi[e]);

        const single = { 'k': 'ক', 'g': 'গ', 'c': 'চ', 'j': 'জ', 'T': 'ট', 'D': 'ড', 't': 'ত', 'd': 'দ', 'n': 'ন', 'p': 'প', 'f': 'ফ', 'b': 'ব', 'v': 'ভ', 'm': 'ম', 'r': 'র', 'l': 'ল', 's': 'স', 'h': 'হ', 'y': 'য়', 'z': 'য', 'w': 'ও' };

        for (let e in single) out = out.split(e).join(single[e]);

        const cons = 'কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ং';

        const kars = { 'oi': 'ৈ', 'ou': 'ৌ', 'a': 'া', 'i': 'ি', 'I': 'ী', 'u': 'ু', 'U': 'ূ', 'e': 'ে', 'O': 'ো', 'o': '' };

        for (let e in kars) out = out.replace(new RegExp(`([${cons}])${e}`, 'g'), `$1${kars[e]}`);

        const vowels = { 'oi': 'ঐ', 'ou': 'ঔ', 'a': 'আ', 'i': 'ই', 'I': 'ঈ', 'u': 'উ', 'U': 'ঊ', 'e': 'এ', 'O': 'ও', 'o': 'অ' };

        for (let e in vowels) out = out.split(e).join(vowels[e]);

        return out;

    }



    // 2. HINDI (हिन्दी)

    if (langCode === 'hi') {

        out = engWord;

        const multi = { 'kh': 'ख', 'gh': 'घ', 'ch': 'छ', 'jh': 'झ', 'th': 'थ', 'dh': 'ध', 'ph': 'फ', 'bh': 'भ', 'sh': 'श' };

        for (let e in multi) out = out.split(e).join(multi[e]);

        const single = { 'k': 'क', 'g': 'ग', 'c': 'च', 'j': 'ज', 'T': 'ट', 'D': 'ड', 't': 'त', 'd': 'द', 'n': 'न', 'p': 'प', 'f': 'फ', 'b': 'ब', 'v': 'भ', 'm': 'म', 'r': 'र', 'l': 'ल', 's': 'स', 'h': 'ह', 'y': 'य', 'z': 'ज़', 'w': 'व' };

        for (let e in single) out = out.split(e).join(single[e]);

        const cons = 'कखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह';

        const kars = { 'oi': 'ै', 'ou': 'ौ', 'a': 'ा', 'i': 'ि', 'I': 'ी', 'u': 'ु', 'U': 'ू', 'e': 'े', 'O': 'ो', 'o': '' };

        for (let e in kars) out = out.replace(new RegExp(`([${cons}])${e}`, 'g'), `$1${kars[e]}`);

        const vowels = { 'oi': 'ऐ', 'ou': 'औ', 'a': 'आ', 'i': 'इ', 'I': 'ई', 'u': 'उ', 'U': 'ऊ', 'e': 'ए', 'O': 'ओ', 'o': 'अ' };

        for (let e in vowels) out = out.split(e).join(vowels[e]);

        return out;

    }



    // 3. ARABIC (العربية - Arabizi)

    if (langCode === 'ar') {

        const multi = { 'th': 'ث', 'kh': 'خ', 'dh': 'ذ', 'sh': 'ش', 'gh': 'غ', 'ou': 'و', 'oo': 'و', 'ee': 'ي' };

        for (let e in multi) out = out.split(e).join(multi[e]);

        const single = { 'a': 'ا', 'b': 'ب', 't': 'ت', 'j': 'ج', 'h': 'ح', 'd': 'د', 'r': 'ر', 'z': 'ز', 's': 'س', 'S': 'ص', 'D': 'ض', 'T': 'ط', 'Z': 'ظ', 'e': 'ع', 'f': 'ف', 'q': 'ق', 'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'w': 'و', 'y': 'ي', 'i': 'ي', 'u': 'و' };

        for (let e in single) out = out.split(e).join(single[e]);

        return out;

    }



    // 4. URDU (اردو - Roman Urdu)

    if (langCode === 'ur') {

        const multi = { 'kh': 'خ', 'ch': 'چ', 'sh': 'ش', 'gh': 'غ', 'ph': 'پھ', 'th': 'تھ', 'dh': 'دھ', 'bh': 'بھ' };

        for (let e in multi) out = out.split(e).join(multi[e]);

        const single = { 'a': 'ا', 'b': 'ب', 'p': 'پ', 't': 'ت', 'T': 'ٹ', 'j': 'ج', 'h': 'ح', 'd': 'د', 'D': 'ڈ', 'r': 'ر', 'R': 'ڑ', 'z': 'ز', 's': 'س', 'f': 'ف', 'q': 'ق', 'k': 'ک', 'g': 'گ', 'l': 'ل', 'm': 'م', 'n': 'ن', 'w': 'و', 'v': 'و', 'y': 'ی', 'e': 'ے', 'i': 'ی', 'u': 'و' };

        for (let e in single) out = out.split(e).join(single[e]);

        return out;

    }



    // 5. RUSSIAN (Русский - Cyrillic Phonetic)

    if (langCode === 'ru') {

        const multi = { 'shch': 'щ', 'sh': 'ш', 'ch': 'ч', 'zh': 'ж', 'yu': 'ю', 'ya': 'я', 'yo': 'ё', 'ts': 'ц' };

        for (let e in multi) out = out.split(e).join(multi[e]);

        const single = { 'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'e': 'е', 'z': 'з', 'i': 'и', 'j': 'й', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'f': 'ф', 'h': 'х', 'y': 'ы' };

        for (let e in single) out = out.split(e).join(single[e]);

        return out;

    }



    return null;

}