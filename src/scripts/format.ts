import { getLetterOrdinalNumber } from './generate-letters.js'

function formatTimeSlot(amount: number) {
    amount = Math.floor(amount);
    if      (amount < 0) return '00';
    else if (amount < 10) return '0' + amount;
    return '' + amount;
}

function formatTime(sec: number) {
    let mins = sec > 0 
        ? Math.floor(sec / 60)
        : Math.ceil(sec / 60);
    let secs = sec - mins * 60;
    return formatTimeSlot(mins) + ':' + formatTimeSlot(secs);
}

function formatResult(res: number) {
    if (res < 10) return '  ' + res;
    else if (res < 100) return ' ' + res;
    return '' + res;
}

function escapeMissingLetters(word: string, freqmap: Array<number>) {
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

    if (valid) return null;

    ret += close;
    return ret;
}

// shamelessly copy-pasted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
function escapeRegExp(str: string) {
    return str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function filterNonAlphabetics(str: string) {
    return str.replace(/[^a-zA-Z]+/g, '')
}

export { formatTime, formatResult, escapeMissingLetters, escapeRegExp, filterNonAlphabetics };
