const englishConfig = {
    code: 'en',
    name: 'English',
    alphabet: 'abcdefghijklmnopqrstuvwxyz',
    //              a     b     c     d      e     f    g     h     i     j    k     l     m     n     o     p     q     r     s     t    u     v     w     x     y     z
    frequencies: [8.12, 1.49, 2.71, 4.32, 12.02, 2.3, 2.03, 5.92, 7.31, 0.1, 0.69, 3.98, 2.61, 6.95, 7.68, 1.82, 0.11, 6.02, 6.28, 9.1, 2.88, 1.11, 2.09, 0.17, 2.11, 0.07],
    limits: [3, 2, 2, 2, 3, 2, 2, 2, 3, 1, 2, 3, 2, 3, 3, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2],
    vowels: 'ieaouy'
};
const swedishConfig = {
    code: 'sv',
    name: 'Swedish',
    alphabet: 'abcdefghijklmnopqrstuvwxyzåäö',
    //              a    b    c    d     e    f    g    h    i    j    k    l    m    n    o    p    q     r    s    t    u    v    w    x    y    z     å    ä    ö
    frequencies: [9.0, 1.3, 1.2, 4.8, 10.1, 1.9, 3.0, 1.9, 6.2, 0.6, 3.4, 5.0, 3.4, 8.6, 4.4, 1.8, 0.01, 8.7, 6.9, 8.2, 1.8, 2.5, 0.1, 0.1, 0.5, 0.01, 1.3, 1.7, 1.5],
    limits: [3, 2, 2, 2, 3, 2, 3, 2, 3, 2, 2, 3, 2, 4, 3, 3, 1, 3, 3, 3, 2, 2, 2, 1, 2, 2, 2, 2, 2],
    vowels: 'eaiouäöåy'
};
const languageConfigs = {
    'en': englishConfig,
    'sv': swedishConfig
};
function getLetterOrdinalNumber(letter, lang = 'en') {
    const config = languageConfigs[lang];
    const ret = config.alphabet.indexOf(letter.toLowerCase());
    if (ret < 0) {
        throw new Error(`Invalid symbol "${letter}" (lowercase: "${letter.toLowerCase()}") for ${config.name} language with alphabet "${config.alphabet}"`);
    }
    return ret;
}
/**
 * Checks if a character is defined as a vowel in the provided configuration.
 */
function isVowel(chr, config) {
    return config.vowels.includes(chr);
}
/**
 * Normalizes frequencies to create cumulative intervals [0.0, 1.0].
 * @param freqs The frequency array for the language.
 * @returns An array of cumulative probabilities (intervals).
 */
function getIntervals(freqs) {
    const base_sum = freqs.reduce((accumulator, value) => accumulator + value);
    let ret = [...freqs];
    ret[0] /= base_sum;
    for (let i = 1; i < freqs.length; i++) {
        ret[i] /= base_sum;
        ret[i] += ret[i - 1];
    }
    return ret;
}
/**
 * Generates a sequence of letters based on the provided language configuration and limits.
 * @param config The LanguageConfig for the target language.
 * @returns An object containing the final alpha_count (frequency map) and the generated letters array.
 */
function generateImpl(config) {
    // Initialize frequency count based on the size of the alphabet in the config
    let alpha_count = new Array(config.alphabet.length).fill(0);
    let letters = new Array();
    let vowel_count = 0;
    // Working copies of the main alphabet data
    let freqs = [...config.frequencies];
    let alphabet = [...config.alphabet];
    let intervals = getIntervals(freqs);
    let vowels_only = false;
    for (let i = 0; i < 16; i++) {
        const nmb = Math.random();
        // Check if we need to switch generation mode (vowels only)
        if ((i > 13) && (vowel_count < 3) && !vowels_only) {
            for (let j = 0; j < freqs.length; ++j) {
                if (!isVowel(alphabet[j], config))
                    freqs[j] = 0.0;
            }
            intervals = getIntervals(freqs);
            vowels_only = true;
        }
        // Find the letter index based on random number and current intervals
        const lower_bound = (element) => element > nmb;
        let letter_index = intervals.findIndex(lower_bound);
        if (letter_index === -1) {
            // Should not happen if frequencies are correctly calculated, but as a safeguard
            break;
        }
        const letter = alphabet[letter_index];
        if (isVowel(letter, config))
            ++vowel_count;
        // Update the count for this specific character in the language's alphabet
        alpha_count[letter_index]++;
        // Check if the limit for this letter has been reached
        if (alpha_count[letter_index] >= config.limits[letter_index]) {
            // Remove the current letter from the pool
            freqs[letter_index] = 0.0;
            // Rebuild intervals based on the reduced set of characters
            intervals = getIntervals(freqs);
        }
        letters.push(letter);
    }
    return { alpha_count: alpha_count, letters: letters };
}
// shamelessly copy-pasted from https://stackoverflow.com/a/12646864
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
/**
 * Generates letters for a specific language and returns the result object, including configuration.
 * @param langCode The language identifier ('en', 'sv').
 * @returns An object containing alpha_count (frequency map), generated letters array, and LanguageConfig.
 */
function generate(langCode = 'en') {
    const config = languageConfigs[langCode];
    const results = generateImpl(config);
    return { ...results, config };
}
export { generate, getLetterOrdinalNumber, shuffle };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtbGV0dGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3JpcHRzL2dlbmVyYXRlLWxldHRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBZUEsTUFBTSxhQUFhLEdBQW1CO0lBQ2xDLElBQUksRUFBRSxJQUFJO0lBQ1YsSUFBSSxFQUFFLFNBQVM7SUFDZixRQUFRLEVBQUUsNEJBQTRCO0lBQ3RDLHFLQUFxSztJQUNySyxXQUFXLEVBQUUsQ0FBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFFO0lBQ3pLLE1BQU0sRUFBTyxDQUFLLENBQUMsRUFBSyxDQUFDLEVBQUssQ0FBQyxFQUFLLENBQUMsRUFBTSxDQUFDLEVBQUksQ0FBQyxFQUFLLENBQUMsRUFBSyxDQUFDLEVBQUssQ0FBQyxFQUFJLENBQUMsRUFBSyxDQUFDLEVBQUssQ0FBQyxFQUFLLENBQUMsRUFBSyxDQUFDLEVBQUssQ0FBQyxFQUFLLENBQUMsRUFBSyxDQUFDLEVBQUssQ0FBQyxFQUFLLENBQUMsRUFBSSxDQUFDLEVBQUssQ0FBQyxFQUFLLENBQUMsRUFBSyxDQUFDLEVBQUssQ0FBQyxFQUFLLENBQUMsRUFBSyxDQUFDLENBQUU7SUFDekssTUFBTSxFQUFFLFFBQVE7Q0FDbkIsQ0FBQztBQUVGLE1BQU0sYUFBYSxHQUFtQjtJQUNsQyxJQUFJLEVBQUUsSUFBSTtJQUNWLElBQUksRUFBRSxTQUFTO0lBQ2YsUUFBUSxFQUFFLCtC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