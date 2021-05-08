'use strict';

import { generate } from './generate-letters.js';
import { formatTime, formatResult, escapeMissingLetters, escapeRegExp, filterNonAlphabetics } from './format.js';
import { PromiseQueue, FetchResult } from './queue.js';

let freqmap = Array(26).fill(0);
let queue = new PromiseQueue();

function createLetterDiv(letter: string) {
    let cell_div = document.createElement('div');
    cell_div.setAttribute('class', 'hbox-nowrap cell l-' + letter);
    cell_div.textContent = letter;
    return cell_div;
}

function generateLetters() {
    const letters_div = document.getElementById('letters');
    letters_div!.textContent = '';
    
    const {alpha_count, letters} = generate();
    freqmap = alpha_count;
    
    for (const letter of letters) {
        letters_div!.append(createLetterDiv(letter));
    }
}

function getFetchResultHandler(word: Element) {
    return (fetch_result: FetchResult) => {
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
    }
}

function resend(e: Event) {
    const button = document.getElementById('resend');
    button!.removeEventListener('click', resend);

    const failed_words = document.querySelectorAll('.network-failure');
    if (failed_words.length > 0) {
        const results = document.getElementById('result');
        results!.classList.add('pending-result');
        results!.textContent = "Result:  ";

        const disclaimer = document.getElementById('network-issues-disclaimer');
        disclaimer!.classList.add('hidden');
    }

    for (const word of failed_words) {
        word.classList.remove('network-failure');
        word.classList.add('pending-score');

        queue.enqueue('' + word.textContent).then(getFetchResultHandler(word));
    }

    e.stopPropagation();
}

function reportResults(results: Element) {
    let res = 0;
    const successElements = document.getElementsByClassName('success');
    for (const element of successElements) {
        const word = element.textContent;
        res += word!.length - 2;
    }
    results.classList.remove('pending-result');
    results.textContent = 'Result: ' + formatResult(res);

    const failed_words = document.querySelectorAll('.network-failure');
    if (failed_words.length > 0) {
        const disclaimer = document.getElementById('network-issues-disclaimer');
        disclaimer!.classList.remove('hidden');
        const resend_button = document.getElementById('resend');
        resend_button!.addEventListener('click', resend);
    }
}

function stopTimer(tmr: number) {
    // stop timer
    clearInterval(tmr);

    // hide input & disable event listening for it
    const word_input = document.getElementById('word') as HTMLInputElement;
    word_input.value = '';
    word_input.classList.add('hidden');
    word_input.removeEventListener('keypress', handleWord);
    word_input.removeEventListener('beforeinput', handleBeforeInput);
    word_input.removeEventListener('input', handleInput);

    dehighlightLetters();

    // show results
    const results = document.getElementById('result');
    results!.classList.remove('hidden');
    results!.classList.add('pending-result');

    queue.deplete(() => { reportResults(results!); });
}

function startTimer(minutes: number) {
    const left = document.getElementById('timeleft');
    let sec = Math.floor(minutes * 60);
    left!.textContent = formatTime(sec);

    let tmr = setInterval(() => {
        if (sec === 0) {
            stopTimer(tmr);
            return;
        }
        --sec;
        left!.textContent = formatTime(sec);
    }, 1000);

    return tmr;
}

function publishWord(word: string | null) {
    if (word === null || word.length < 2)
        return;

    const id = 'w_' + word;
    const found_word = document.getElementById(id);
    const scores = document.getElementById('scores');
    if (undefined != found_word) {
        scores!.removeChild(found_word);
        scores!.append(found_word);
        found_word.classList.add('moved');
        setTimeout(() => {
            found_word.classList.remove('moved');
        }, 1000)
        return;
    }

    let published_word = document.createElement('p');
    published_word.classList.add('score');
    published_word.setAttribute('id', id);
    scores!.append(published_word);
    
    const escaped = escapeMissingLetters(word, freqmap);
    if (escaped === null) {
        published_word.textContent = word;
        published_word.classList.add('pending-score');
        queue.enqueue(word).then(getFetchResultHandler(published_word));
    } else {
        published_word.innerHTML = escaped;
        published_word.classList.add('failure');
    }
}

function highlightLetter(letter: string) {
    const cell_div = document.querySelector('.l-' + letter.toLowerCase() + ':not(.highlighted)');
    if (cell_div !== null) cell_div.classList.add('highlighted');
}

function dehighlightLetter(letter: string) {
    const cell_div = document.querySelector('.l-' + letter.toLowerCase() + '.highlighted');
    if (cell_div !== null) cell_div.classList.remove('highlighted');
}

function dehighlightLetters() {
    for (let cell_div of document.querySelectorAll('.highlighted')) {
        cell_div.classList.remove('highlighted');
    }
}

function redoLettersHighlighting() {
    dehighlightLetters();
    const word_input = document.getElementById('word') as HTMLInputElement;
    const alphas = filterNonAlphabetics(word_input!.value);
    for (const alpha of alphas) {
        highlightLetter(alpha);
    }
}

function handleWord(e: Event) {
    switch((e as KeyboardEvent).key) {
        case "Enter":
            const word_input = document.getElementById('word') as HTMLInputElement;
            const word_unescaped = new String(word_input.value);
            if (word_input!.checkValidity() && word_unescaped.length > 2) {
                word_input!.value = '';
                dehighlightLetters();
                const word = escapeRegExp(word_unescaped.toLowerCase());
                publishWord(word);
            }
            break;
    }
    e.stopPropagation();
}

function handleBeforeInput(e: Event) {
    const word_input = document.getElementById('word') as HTMLInputElement;
    const begin = word_input!.selectionStart!;
    const end = word_input!.selectionEnd!;
    if ((e as InputEvent).inputType === "insertText" && (e as InputEvent).data !== null && begin !== end) {
        const alphas = filterNonAlphabetics(word_input!.value.substring(begin, end));
        for (const alpha of alphas) dehighlightLetter(alpha);
    }
}

function handleInput(e: Event) {
    if ((e as InputEvent).inputType === 'insertText' && (e as InputEvent).data !== null) {
        const alphas = filterNonAlphabetics((e as InputEvent).data!);
        for (const alpha of alphas) highlightLetter(alpha);
    } else {
        redoLettersHighlighting();
    }
}

function reset() {
    queue.deplete(() => { console.log("old queue depleted"); });
    queue = new PromiseQueue();

    const resend_button = document.getElementById('resend');
    resend_button!.removeEventListener('click', resend);
    const disclaimer = document.getElementById('network-issues-disclaimer');
    disclaimer!.classList.add('hidden');

    generateLetters();

    const word_input = document.getElementById('word');
    word_input!.classList.remove('hidden');
    word_input!.addEventListener('keypress', handleWord);
    word_input!.addEventListener('beforeinput', handleBeforeInput);
    word_input!.addEventListener('input', handleInput);
    word_input!.focus();

    const results = document.getElementById('result');
    results!.textContent = 'Result:  ';
    results!.classList.add('hidden');
    results!.classList.remove('pending-result');

    const scores = document.getElementById('scores');
    scores!.textContent = '';

    const tmr = startTimer(2);

    const again = document.getElementById('again');
    const once = { once : true };
    again!.addEventListener('click', (event) => { stopTimer(tmr); reset() }, once );
}

window.addEventListener('load', function () {
    reset();
});
