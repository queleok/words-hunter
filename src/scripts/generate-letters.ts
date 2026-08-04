type LanguageCode = 'en' | 'sv';

interface LanguageConfig {
    code: LanguageCode;
    name: string;
    // The characters in the language's alphabet
    alphabet: string;
    // Frequency values corresponding to alphabet (normalized later)
    frequencies: number[];
    // Maximum allowed count for each character (limits must match the length of alphabet)
    limits: number[];
    // Vowels specific to this language
    vowels: string;
}

const englishConfig: LanguageConfig = {
    code: 'en',
    name: 'English',
    alphabet: 'abcdefghijklmnopqrstuvwxyz',
    //              a     b     c     d      e     f    g     h     i     j    k     l     m     n     o     p     q     r     s     t    u     v     w     x     y     z
    frequencies: [ 8.12, 1.49, 2.71, 4.32, 12.02, 2.3, 2.03, 5.92, 7.31, 0.1, 0.69, 3.98, 2.61, 6.95, 7.68, 1.82, 0.11, 6.02, 6.28, 9.1, 2.88, 1.11, 2.09, 0.17, 2.11, 0.07 ],
    limits:      [    3,    2,    2,    2,     3,   2,    2,    2,    3,   1,    2,    3,    2,    3,    3,    2,    2,    2,    3,   3,    2,    2,    2,    2,    2,    2 ],
    vowels: 'ieaouy'
};

const swedishConfig: LanguageConfig = {
    code: 'sv',
    name: 'Swedish',
    alphabet: 'abcdefghijklmnopqrstuvwxyzåäö',
    //              a    b    c    d     e    f    g    h    i    j    k    l    m    n    o    p    q     r    s    t    u    v    w    x    y    z     å    ä    ö
    frequencies: [ 9.0, 1.3, 1.2, 4.8, 10.1, 1.9, 3.0, 1.9, 6.2, 0.6, 3.4, 5.0, 3.4, 8.6, 4.4, 1.8, 0.01, 8.7, 6.9, 8.2, 1.8, 2.5, 0.1, 0.1, 0.5, 0.01, 1.3, 1.7, 1.5 ],
    limits:      [   3,   2,   2,   2,   3,    2,   3,   2,   3,   2,   2,   3,   2,   4,   3,   3,   1,    3,   3,   3,   2,   2,   2,   1,   2,    2,   2,   2,   2 ],
    vowels: 'eaiouäöåy'
};

const languageConfigs = {
    'en': englishConfig,
    'sv': swedishConfig
};

function getLetterOrdinalNumber(letter: string, lang: LanguageCode = 'en') {
    const config = languageConfigs[lang];

    const ret = config.alphabet.indexOf(letter.toLowerCase());
    if (ret < 0) {
        throw new Error(`Invalid symbol "${letter}" (lowercase: "${letter.toLowerCase()}") for ${config.name} language with alphabet "${config.alphabet}"`);
    }

    return ret;
}

// ============= BACKWARD COMPATIBILITY CODE BLOCK BEGINS ========================
//               a  b  c  d  e  f  g  h  i  j  k  l  m  n  o  p  q  r  s  t  u  v  w  x  y  z
const limits = [ 3, 2, 2, 2, 3, 2, 2, 2, 3, 1, 2, 3, 2, 3, 3, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2 ];
// ============= BACKWARD COMPATIBILITY CODE BLOCK ENDS ========================

/**
 * Checks if a character is defined as a vowel in the provided configuration.
 */
function isVowel(chr: string, config: LanguageConfig): boolean {
    return config.vowels.includes(chr);
}

/**
 * Normalizes frequencies to create cumulative intervals [0.0, 1.0].
 * @param freqs The frequency array for the language.
 * @returns An array of cumulative probabilities (intervals).
 */
function getIntervals(freqs: number[]): number[] {
    const base_sum = freqs.reduce((accumulator: number, value: number) => accumulator + value);
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
function generateImpl(config: LanguageConfig): { alpha_count: number[], letters: string[] } {
    // Initialize frequency count based on the size of the alphabet in the config
    let alpha_count = new Array(config.alphabet.length).fill(0);
    let letters = new Array<string>();

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
                if (!isVowel(alphabet[j], config)) freqs[j] = 0.0;
            }
            intervals = getIntervals(freqs);
            vowels_only = true;
        }

        // Find the letter index based on random number and current intervals
        const lower_bound = (element: number) => element > nmb;
        let letter_index = intervals.findIndex(lower_bound);

        if (letter_index === -1) {
            // Should not happen if frequencies are correctly calculated, but as a safeguard
            break; 
        }

        const letter = alphabet[letter_index];
        if (isVowel(letter, config)) ++vowel_count;

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
function shuffle<Type>(array: Array<Type>) {
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
function generate(langCode: LanguageCode = 'en'): { alpha_count: number[], letters: string[], config: LanguageConfig } {
    const config = languageConfigs[langCode];
    const results = generateImpl(config);
    return { ...results, config };
}

export { LanguageConfig, LanguageCode, limits, generate, getLetterOrdinalNumber, shuffle };
