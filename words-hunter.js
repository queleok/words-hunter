let freqmap = Array(26).fill(0);
const a_code = 'a'.charCodeAt(0);

// Letters frequency according to Cornwell University Math Explorer's Project:
// http://pi.math.cornell.edu/~mec/2003-2004/cryptography/subs/frequencies.html
const letters_by_freqency = ['e', 't', 'a', 'o', 'i', 'n', 's', 'r', 'h', 'd', 'l', 'u', 'c', 'm', 'f', 'y', 'w', 'g', 'p', 'b', 'v', 'k', 'x', 'q', 'j', 'z'];

/**
 * Box-Muller transform for sampling standard normal distribution.
 * Shamelessly copy-pasted from the stackoverflow
 * https://stackoverflow.com/a/36481059/14197098
 */
function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

/**
 * Naive & sloppy generation of letters: distribution of letters sorted by their
 * frequency is assumed to be the standard normal distribution for simplicity.
 */
function generateLetters() {
    const letters_div = document.getElementById('letters');
    letters_div.textContent = '';

    freqmap = Array(26).fill(0);

    for (i = 0; i < 16; i++) {
        const letter_index = Math.floor(Math.abs(randn_bm()) * 25 / 2);
        const letter = letters_by_freqency[letter_index % 25];
        ++freqmap[letter.charCodeAt(0) - a_code];

        let cell_div = document.createElement('div');
        cell_div.setAttribute('class', 'hbox-nowrap cell');
        cell_div.textContent = letter;
        letters_div.append(cell_div);
    }
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

function reportResults() {
    let res = 0;
    const successElements = document.getElementsByClassName('success');
    for (const element of successElements) {
        const word = element.textContent;
        res += word.length - 2;
    }
    const results = document.getElementById('result');
    results.textContent = 'Result:  ' + res;
}

function reportResultsOrWait() {
    const pendingElements = document.getElementsByClassName('pending');
    if (pendingElements.length === 0) {
        reportResults();
    } else {
        console.log('there are still unprocessed elements, delaying report rendering by 2 sec')
        setTimeout(reportResults, 2000);
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
    reportResultsOrWait();
    
    // show play again button
    const again = document.getElementById('again');
    again.classList.remove('hidden');
    again.addEventListener('click', reset);
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
}

function validateWord(word) {
    const freq = [...freqmap];
    
    for (i = 0; i < word.length; i++) {
        if (--freq[word.charCodeAt(i) - a_code] < 0) return false;
    }

    return true;
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
                    if (status_ok)
                        published_word.setAttribute('class', 'score success');
                    else if (attempts <= 0) {
                        Promise.reject(response.status);
                        return;
                    } else
                        tryFetch(word, published_word, --attempts);
                })
                .catch(function(error) {
                    if (error === 404)
                        published_word.setAttribute('class', 'score failure');
                    else {
                        console.log('Failed to resolve word "' + word + '" due to network issues, error: ' + error);
                        published_word.setAttribute('id', '');
                        published_word.setAttribute('class', 'score network-failure');
                    }
                })
        }, 500);
}

function publishWord(word) {
    if (word === null || word.length < 2)
        return;

    const id = 'w_' + word;
    if (undefined != document.getElementById(id)) return;

    const scores = document.getElementById('scores');
    let published_word = document.createElement('p');
    published_word.textContent = word;
    published_word.setAttribute('class', 'score pending');
    published_word.setAttribute('id', id);
    scores.append(published_word);
    
    if (validateWord(word)) {
        tryFetch(word, published_word, 2);
    } else {
        published_word.setAttribute('class', 'score failure');
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

function reset() {
    generateLetters();

    const word_input = document.getElementById('word');
    word_input.classList.remove('hidden');
    word_input.addEventListener('keypress', handleWord);
    
    const results = document.getElementById('result');
    results.textContent = 'Result: ...';
    results.classList.add('hidden');
    
    const again = document.getElementById('again');
    again.removeEventListener('click', reset);
    again.classList.add('hidden');
    
    const scores = document.getElementById('scores');
    scores.textContent = '';

    startTimer(2);
}

window.addEventListener('load', function () {
    reset();
});