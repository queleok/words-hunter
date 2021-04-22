const a_code = 'a'.charCodeAt(0);

function getLetterOrdinalNumber(letter: string) {
    return letter.charCodeAt(0) - a_code;
}

// Letters frequency according to Cornwell University Math Explorer's Project:
// http://pi.math.cornell.edu/~mec/2003-2004/cryptography/subs/frequencies.html
const letters_by_frequency = ['e', 't', 'a', 'o', 'i', 'n', 's', 'r', 'h', 'd', 'l', 'u', 'c', 'm', 'f', 'y', 'w', 'g', 'p', 'b', 'v', 'k', 'x', 'q', 'j', 'z' ];
const frequencies = [12.02, 9.10, 8.12, 7.68, 7.31, 6.95, 6.28, 6.02, 5.92, 4.32, 3.98, 2.88, 2.71, 2.61, 2.30, 2.11, 2.09, 2.03, 1.82, 1.49, 1.11, 0.69, 0.17, 0.11, 0.10, 0.07];

// Vowels frequency in 14+-letter words from the 100k wiktionary (see docs for more info)
const vowels_by_frequency = ['i', 'e', 'a', 'o', 'u', 'y'];
const frequencies_vowels = [ 0.280220, 0.260504, 0.174855, 0.162250, 0.086296, 0.035876 ];

//               a  b  c  d  e  f  g  h  i  j  k  l  m  n  o  p  q  r  s  t  u  v  w  x  y  z
const limits = [ 3, 2, 2, 2, 3, 2, 2, 2, 3, 1, 2, 3, 2, 3, 3, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2 ];

function isVowel(chr: string) {
    return vowels_by_frequency.indexOf(chr) !== -1;
}

function getIntervals(freqs: Array<number>) {
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
 * Shortly put, frequencies are normalized to their sum and are used to divide
 * the interval [0.0, 1.0] into 26 (initially) sub-intervals with widths proportioanl
 * to their value (the bigger the frequency, the wider the sub-interval). Maximal
 * limits of repetitions are posed on letters based on 99-th percentile in the
 * distribution of letters built from the 100k words from the wiki dictionary.
 * When the limit is reached, the letter is removed from the array of elements to be
 * considered, and sub-intervals are re-built from the remaining elements. If there
 * are less than 3 vowels after generation of the first 13 letters, the last three
 * letters will be generated from vowels only based on their distribution in long
 * words (14+ letters).
 * 
 * See docs/wiki100k-stats.ipynb for the rationale behind the implemented algorithm.
 */
function generate() {
    let alpha_count = new Array(26).fill(0);
    let letters = new Array();

    let freqs_vowels = [...frequencies_vowels];
    let vowel_by_freq = [...vowels_by_frequency];
    let vowel_count = 0;

    let freqs = [...frequencies];
    let let_by_freq = [...letters_by_frequency];
    let intervals = getIntervals(freqs);

    for (let i = 0; i < 16; i++) {
        const nmb = Math.random();
        
        if ((i > 13) && (vowel_count < 3) && (freqs !== freqs_vowels)) {
            let_by_freq = vowel_by_freq;
            freqs = freqs_vowels;
            intervals = getIntervals(freqs);
        }

        const lower_bound = (element: number) => element > nmb;
        const letter_index = intervals.findIndex(lower_bound);
        const letter = let_by_freq[letter_index];
        if (isVowel(letter)) ++vowel_count;

        const letter_order = getLetterOrdinalNumber(letter);
        ++alpha_count[letter_order];

        if (alpha_count[letter_order] === limits[letter_order]) {
            let_by_freq.splice(letter_index, 1);
            freqs.splice(letter_index, 1);
            let vowel_index = vowel_by_freq.indexOf(letter);
            if (vowel_index >= 0) {
                vowel_by_freq.splice(vowel_index, 1);
                freqs_vowels.splice(vowel_index, 1);
            }
            intervals = getIntervals(freqs);
        }

        letters.push(letter);
    }
    return { alpha_count, letters };
}

export { generate, getLetterOrdinalNumber };
