const a_code = 'a'.charCodeAt(0);
function getLetterOrdinalNumber(letter) {
    return letter.toLowerCase().charCodeAt(0) - a_code;
}
// Letters frequency according to Cornwell University Math Explorer's Project:
// http://pi.math.cornell.edu/~mec/2003-2004/cryptography/subs/frequencies.html
const letters_by_frequency = ['e', 't', 'a', 'o', 'i', 'n', 's', 'r', 'h', 'd', 'l', 'u', 'c', 'm', 'f', 'y', 'w', 'g', 'p', 'b', 'v', 'k', 'x', 'q', 'j', 'z'];
const frequencies = [12.02, 9.10, 8.12, 7.68, 7.31, 6.95, 6.28, 6.02, 5.92, 4.32, 3.98, 2.88, 2.71, 2.61, 2.30, 2.11, 2.09, 2.03, 1.82, 1.49, 1.11, 0.69, 0.17, 0.11, 0.10, 0.07];
// Vowels frequency in 14+-letter words from the 100k wiktionary (see docs for more info)
const vowels_by_frequency = ['i', 'e', 'a', 'o', 'u', 'y'];
const frequencies_vowels = [0.280220, 0.260504, 0.174855, 0.162250, 0.086296, 0.035876];
//               a  b  c  d  e  f  g  h  i  j  k  l  m  n  o  p  q  r  s  t  u  v  w  x  y  z
const limits = [3, 2, 2, 2, 3, 2, 2, 2, 3, 1, 2, 3, 2, 3, 3, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2];
function isVowel(chr) {
    return vowels_by_frequency.indexOf(chr) !== -1;
}
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
        const lower_bound = (element) => element > nmb;
        const letter_index = intervals.findIndex(lower_bound);
        const letter = let_by_freq[letter_index];
        if (isVowel(letter))
            ++vowel_count;
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
// shamelessly copy-pasted from https://stackoverflow.com/a/12646864
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
export { limits, generate, getLetterOrdinalNumber, shuffle };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGUtbGV0dGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zY3JpcHRzL2dlbmVyYXRlLWxldHRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUVqQyxTQUFTLHNCQUFzQixDQUFDLE1BQWM7SUFDMUMsT0FBTyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztBQUN2RCxDQUFDO0FBRUQsOEVBQThFO0FBQzlFLCtFQUErRTtBQUMvRSxNQUFNLG9CQUFvQixHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBRSxDQUFDO0FBQ2pLLE1BQU0sV0FBVyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxD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