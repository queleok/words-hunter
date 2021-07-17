'use strict';
import { generate, shuffle } from './generate-letters.js';
import { formatTime, formatResult, escapeMissingLetters } from './format.js';
import { PromiseQueue } from './queue.js';
import { LetterWidget, WordSynchronizer } from './ui.js';
let freqmap = Array(26).fill(0);
let queue = new PromiseQueue();
function generateLetters(letters_div, synchronizer) {
    letters_div.textContent = '';
    const { alpha_count, letters } = generate();
    freqmap = alpha_count;
    let ret = new Array();
    for (const letter of letters) {
        ret.push(new LetterWidget(letter, letters_div, synchronizer));
    }
    return ret;
}
function getFetchResultHandler(word) {
    return (fetch_result) => {
        switch (fetch_result) {
            case "success":
                word.setAttribute('class', 'score success');
                break;
            case "validation-failure":
            case "no-definition":
                word.setAttribute('class', 'score failure');
                break;
            case "network-failure":
                word.setAttribute('class', 'score network-failure');
                break;
        }
    };
}
function resend(e) {
    const failed_words = document.querySelectorAll('.network-failure');
    if (failed_words.length > 0) {
        const results = document.getElementById('result');
        results.classList.add('pending-result');
        results.textContent = "Result:  ";
        const disclaimer = document.getElementById('network-issues-disclaimer');
        disclaimer.classList.add('hidden');
    }
    for (const word of failed_words) {
        word.classList.remove('network-failure');
        word.classList.add('pending-score');
        queue.enqueue('' + word.textContent).then(getFetchResultHandler(word));
    }
    e.stopPropagation();
}
function reportResults(results) {
    let res = 0;
    const successElements = document.getElementsByClassName('success');
    for (const element of successElements) {
        const word = element.textContent;
        res += word.length - 2;
    }
    results.classList.remove('pending-result');
    results.textContent = 'Result: ' + formatResult(res);
    const failed_words = document.querySelectorAll('.network-failure');
    if (failed_words.length > 0) {
        const disclaimer = document.getElementById('network-issues-disclaimer');
        disclaimer.classList.remove('hidden');
        const resend_button = document.getElementById('resend');
        resend_button.addEventListener('click', resend, { once: true });
    }
}
function stopTimer(tmr, results, synchronizer) {
    // stop timer
    clearInterval(tmr);
    synchronizer.release();
    // show results
    results.classList.remove('hidden');
    results.classList.add('pending-result');
    queue.deplete(() => { reportResults(results); });
}
function startTimer(minutes, results, synchronizer) {
    const left = document.getElementById('timeleft');
    let sec = Math.floor(minutes * 60);
    left.textContent = formatTime(sec);
    let tmr = setInterval(() => {
        if (sec === 0) {
            stopTimer(tmr, results, synchronizer);
            return;
        }
        --sec;
        left.textContent = formatTime(sec);
    }, 1000);
    return tmr;
}
function publishWord(word) {
    if (word.length < 2)
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
        }, 1000);
        return;
    }
    let published_word = document.createElement('p');
    published_word.classList.add('score');
    published_word.setAttribute('id', id);
    scores.append(published_word);
    const escaped = escapeMissingLetters(word, freqmap);
    if (escaped === null) {
        published_word.textContent = word;
        published_word.classList.add('pending-score');
        queue.enqueue(word).then(getFetchResultHandler(published_word));
    }
    else {
        published_word.innerHTML = escaped;
        published_word.classList.add('failure');
    }
}
function reset() {
    queue = new PromiseQueue();
    const disclaimer = document.getElementById('network-issues-disclaimer');
    disclaimer.classList.add('hidden');
    const word = document.getElementById('word');
    const synchronizer = new WordSynchronizer(word, publishWord);
    const letters_div = document.getElementById('letters');
    const letters = generateLetters(letters_div, synchronizer);
    synchronizer.setLetters(letters);
    const shuffler = (e) => {
        const idxs = [...Array(letters_div.children.length).keys()];
        shuffle(idxs);
        // NOTE: childNodes is a live list, hence we can't use it directly
        const children = letters_div.childNodes;
        let sorted_children = new Array();
        for (const idx of idxs) {
            sorted_children.push(children[idx]);
        }
        for (const child of sorted_children) {
            letters_div.appendChild(child);
        }
        e.stopPropagation();
    };
    const shuffle_btn = document.getElementById('shuffle');
    shuffle_btn.addEventListener('click', shuffler);
    const results = document.getElementById('result');
    results.classList.add('hidden');
    results.classList.remove('pending-result');
    const scores = document.getElementById('scores');
    scores.textContent = '';
    const tmr = startTimer(2, results, synchronizer);
    const again = document.getElementById('again');
    again.addEventListener('click', (event) => {
        queue.deplete(() => { console.log("old queue depleted"); });
        stopTimer(tmr, results, synchronizer);
        shuffle_btn.removeEventListener('click', shuffler);
        reset();
    }, { once: true });
}
window.addEventListener('load', function () {
    reset();
});
