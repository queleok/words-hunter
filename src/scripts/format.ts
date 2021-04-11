import { getLetterOrdinalNumber } from './generate-letters.js'

function formatTimeSlot(amount) {
    amount = Math.floor(amount);
    if      (amount < 0) return '00';
    else if (amount < 10) return '0' + amount;
    return '' + amount;
}

function formatTime(sec) {
    let mins = Math.floor(sec / 60);
    let secs = sec - mins * 60;
    return formatTimeSlot(mins) + ':' + formatTimeSlot(secs);
}

function formatResult(res) {
    if (res < 10) return '  ' + res;
    else if (res < 100) return ' ' + res;
    return res;
}

function escapeMissingLetters(word, freqmap) {
    const freq = [...freqmap];
    
    let valid = true;

    let ret = '';
    let open = '<s>';
    let close = '';

    for (let i = 0; i < word.length; i++) {
        const chr = word.charAt(i);
        if (--freq[getLetterOrdinalNumber(chr)] < 0) {
            valid = false;
            ret += open + chr;
            open = '';
            close = '</s>';
        } else {
            ret += close + chr;
            open = '<s>';
            close = '';
        }
    }

    ret += close;

    if (valid) ret = null;

    return ret;
}

// shamelessly copy-pasted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function filterNonAlphabetics(string) {
    return string.replace(/[^a-zA-Z]+/g, '')
}

export { formatTime, formatResult, escapeMissingLetters, escapeRegExp, filterNonAlphabetics };
