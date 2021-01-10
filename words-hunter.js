let freqmap = Array(26).fill(0);
const a_code = 'a'.charCodeAt(0);

// Letters frequency according to Cornwell University Math Explorer's Project:
// http://pi.math.cornell.edu/~mec/2003-2004/cryptography/subs/frequencies.html
const letters_by_frequency = ['e', 't', 'a', 'o', 'i', 'n', 's', 'r', 'h', 'd', 'l', 'u', 'c', 'm', 'f', 'y', 'w', 'g', 'p', 'b', 'v', 'k', 'x', 'q', 'j', 'z' ];
const frequencies = [12.02, 9.10, 8.12, 7.68, 7.31, 6.95, 6.28, 6.02, 5.92, 4.32, 3.98, 2.88, 2.71, 2.61, 2.30, 2.11, 2.09, 2.03, 1.82, 1.49, 1.11, 0.69, 0.17, 0.11, 0.10, 0.07];

// Vowels frequency in 14+-letter words from the 100k wiktionary (see docs for more info)
const vowels_by_frequency = ['i', 'e', 'a', 'o', 'u', 'y'];
const frequencies_vowels = [ 0.280220, 0.260504, 0.174855, 0.162250, 0.086296, 0.035876 ];

//               a  b  c  d  e  f  g  h  i  j  k  l  m  n  o  p  q  r  s  t  u  v  w  x  y  z
const limits = [ 3, 2, 2, 2, 3, 2, 2, 2, 3, 1, 2, 3, 2, 3, 3, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2 ];

function isVowel(chr) {
    return vowels_by_frequency.indexOf(chr) !== -1;
}

function createLetterDiv(letter) {
    let cell_div = document.createElement('div');
    cell_div.setAttribute('class', 'hbox-nowrap cell');
    cell_div.textContent = letter;
    return cell_div;
}

function get_intervals(freqs) {
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
function generateLetters() {
    const letters_div = document.getElementById('letters');
    letters_div.textContent = '';
    
    freqmap = Array(26).fill(0);

    let freqs_vowles = [...frequencies_vowels];
    let vowels = [...vowels_by_frequency];
    let vowel_count = 0;

    let freqs = [...frequencies];
    let letters = [...letters_by_frequency];
    let intervals = get_intervals(freqs);

    for (let i = 0; i < 16; i++) {
        const nmb = Math.random();
        
        if ((i > 13) && (vowel_count < 3) && (freqs !== freqs_vowles)) {
            letters = vowels;
            freqs = freqs_vowles;
            intervals = get_intervals(freqs);
        }

        const lower_bound = (element) => element > nmb;
        const letter_index = intervals.findIndex(lower_bound);
        const letter = letters[letter_index];
        if (isVowel(letter)) ++vowel_count;
        ++freqmap[letter.charCodeAt(0) - a_code];

        if (freqmap[letter.charCodeAt(0) - a_code] === limits[letter.charCodeAt(0) - a_code]) {
            letters.splice(letter_index, 1);
            freqs.splice(letter_index, 1);
            let vowel_index = vowels.indexOf(letter);
            if (vowel_index >= 0) {
                vowels.splice(vowel_index, 1);
                freqs_vowles.splice(vowel_index, 1);
            }
            intervals = get_intervals(freqs);
        }

        letters_div.append(createLetterDiv(letter));
    }
}

const queue = {
    "begin" : null,
    "end" : null,
    "length" : 0,
    "enqueue" : function(item) {
        const node = {
            "item" : item,
            "next" : null
        };
        if (this.begin === null) {
            this.begin = node;
            this.end = this.begin;
        } else {
            this.end.next = node;
            this.end = this.end.next;
        }
        this.length++;

        if (this.length === 1) tryFetch(this.begin.item.word, this.begin.item.published_word, 2);
    },
    "dequeue" : function() {
        if (this.length === 0) {
            console.log('attempt to dequeue empty queue');
            return;
        }

        if (this.length === 1) {
            this.begin = null;
            this.end = null;
            this.length = 0;
            const results = document.getElementById('result');
            if (results.classList.contains('pending-result')) reportResults();
            return;
        }

        this.length--;
        this.begin = this.begin.next;
        tryFetch(this.begin.item.word, this.begin.item.published_word, 2);
    },
    "clear" : function() {
        this.begin = null;
        this.end = null;
        this.length = 0;
    }
};

function resend(e) {
    const button = document.getElementById('resend');
    button.removeEventListener('click', resend);

    const failed_words = document.querySelectorAll('.network-failure');
    if (failed_words.length > 0) {
        const results = document.getElementById('result');
        results.classList.add('pending-result');
        results.textContent = "Result:  ";

        const discailmer = document.getElementById('network-issues-disclaimer');
        discailmer.classList.add('hidden');
    }

    for (const word of failed_words) {
        word.classList.remove('network-failure');
        word.classList.add('pending-score');

        queue.enqueue({"word" : word.textContent, "published_word" : word});
    }

    e.stopPropagation();
}

function formatTimeSlot(amount) {
    amount = Math.floor(amount);
    if      (amount < 0) return '00';
    else if (amount < 10) return '0' + amount;
    return '' + amount;
}

function renderTime(sec) {
    let mins = Math.floor(sec / 60);
    let secs = sec - mins * 60;
    return formatTimeSlot(mins) + ':' + formatTimeSlot(secs);
}

function renderResult(res) {
    if (res < 10) return '  ' + res;
    else if (res < 100) return ' ' + res;
    return res;
}

function reportResults() {
    let res = 0;
    const successElements = document.getElementsByClassName('success');
    for (const element of successElements) {
        const word = element.textContent;
        res += word.length - 2;
    }
    const results = document.getElementById('result');
    results.classList.remove('pending-result');
    results.textContent = 'Result: ' + renderResult(res);

    const failed_words = document.querySelectorAll('.network-failure');
    if (failed_words.length > 0) {
        const discailmer = document.getElementById('network-issues-disclaimer');
        discailmer.classList.remove('hidden');
        const resend_button = document.getElementById('resend');
        resend_button.addEventListener('click', resend);
    }
}

function stopTimer(tmr) {
    // stop timer
    clearInterval(tmr);

    // hide input & disable event listening for it
    const word_input = document.getElementById('word');
    word_input.value = '';
    word_input.classList.add('hidden');
    word_input.removeEventListener('keypress', handleWord);
    
    // show results
    const results = document.getElementById('result');
    results.classList.remove('hidden');

    if (queue.length === 0) {
        reportResults();
    } else {
        results.classList.add('pending-result');
    }
}

function startTimer(minutes) {
    const left = document.createElement('p');
    left.setAttribute('id', 'timeleft');
    let sec = Math.floor(minutes * 60);
    left.textContent = renderTime(sec);

    const timer_div = document.getElementById('timer');
    timer_div.textContent = '';
    timer_div.append(left);

    let tmr = setInterval(() => {
        if (sec === 0) {
            stopTimer(tmr);
            return;
        }
        --sec;
        left.textContent = renderTime(sec);
    }, 1000);
    
    // show play again button
    const again = document.getElementById('again');
    again.addEventListener('click', reset);
    again.tmr = tmr;
}

function escapeMissingLetters(word) {
    const freq = [...freqmap];
    
    let valid = true;

    let ret = '';
    let open = '<s>';
    let close = '';

    for (let i = 0; i < word.length; i++) {
        const chr = word.charAt(i);
        if (--freq[word.charCodeAt(i) - a_code] < 0) {
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

function tryFetch(word, published_word, attempts) {
    setTimeout(() => {
            fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word)
                .then(function(response) {
                    if (response.ok) {
                        return true;
                    } if (response.status === 404) {
                        return Promise.reject(response.status);
                    } else {
                        return false;
                    }
                })
                .then(function(status_ok) {
                    if (status_ok) {
                        published_word.setAttribute('class', 'score success');
                        queue.dequeue();
                    } else if (attempts <= 0) {
                        Promise.reject(response.status);
                    } else
                        tryFetch(word, published_word, --attempts);
                })
                .catch(function(error) {
                    if (error === 404) {
                        published_word.setAttribute('class', 'score failure');
                        queue.dequeue();
                    } else {
                        console.log('Failed to resolve word "' + word + '" due to network issues, error: ' + error);
                        published_word.setAttribute('class', 'score network-failure');
                        queue.dequeue();
                    }
                })
        }, 500);
}

function publishWord(word) {
    if (word === null || word.length < 2)
        return;

    const id = 'w_' + word;
    const found_word = document.getElementById(id);
    const scores = document.getElementById('scores');
    if (undefined != found_word) {
        scores.removeChild(found_word);
        scores.append(found_word);
        found_word.classList.add('moved');
        setTimeout(() => {
            found_word.classList.remove('moved');
        }, 1000)
        return;
    }

    let published_word = document.createElement('p');
    published_word.classList.add('score');
    published_word.setAttribute('id', id);
    scores.append(published_word);
    
    const escaped = escapeMissingLetters(word);
    if (escaped === null) {
        published_word.textContent = word;
        published_word.classList.add('pending-score');
        queue.enqueue({"word" : word, "published_word" : published_word});
    } else {
        published_word.innerHTML = escaped;
        published_word.classList.add('failure');
    }
}

// shamelessly copy-pasted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function handleWord(e) {
    switch(e.keyCode) {
        case 13:
            const word_input = document.getElementById('word');
            const word_unescaped = new String(word_input.value);
            if (word_input.checkValidity() && word_unescaped.length > 2) {
                word_input.value = '';
                const word = escapeRegExp(word_unescaped.toLowerCase());
                publishWord(word);
            }
            break;
    }
    e.stopPropagation();
}

function reset(e) {
    if (e != null && e.currentTarget.tmr != null) {
        stopTimer(e.currentTarget.tmr);
        e.currentTarget.removeEventListener('click', reset);
        delete e.currentTarget.tmr;
    }

    queue.clear();

    const resend_button = document.getElementById('resend');
    resend_button.removeEventListener('click', resend);
    const discailmer = document.getElementById('network-issues-disclaimer');
    discailmer.classList.add('hidden');

    generateLetters();

    const word_input = document.getElementById('word');
    word_input.classList.remove('hidden');
    word_input.addEventListener('keypress', handleWord);
    word_input.focus();
    
    const results = document.getElementById('result');
    results.textContent = 'Result:  ';
    results.classList.add('hidden');
    results.classList.remove('pending-result');
    
    const scores = document.getElementById('scores');
    scores.textContent = '';

    startTimer(2);
}

window.addEventListener('load', function () {
    reset();
});