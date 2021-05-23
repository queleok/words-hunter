'use strict';

import { generate } from './generate-letters.js';
import { formatTime, formatResult, escapeMissingLetters, escapeRegExp, filterNonAlphabetics } from './format.js';
import { PromiseQueue, FetchResult } from './queue.js';
import { LetterWidget, WordSynchronizer } from './ui.js';

let freqmap = Array(26).fill(0);
let queue = new PromiseQueue();

function generateLetters(letters_div: HTMLElement, word_input: HTMLInputElement, synchronizer: WordSynchronizer) {
    letters_div.textContent = '';

    const {alpha_count, letters} = generate();
    freqmap = alpha_count;

    let ret = new Array<LetterWidget>();

    for (const letter of letters) {
        ret.push(new LetterWidget(letter, letters_div, word_input, synchronizer));
    }

    return ret;
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

function reportResults(results: HTMLElement) {
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
        const resend_button = document.getElementById('resend') as HTMLElement;
        resend_button.addEventListener('click', resend, { once: true } );
    }
}

function stopTimer(tmr: number, letters: Array<LetterWidget>
        , word_input: HTMLInputElement, results: HTMLElement
        , handleWord: (e: KeyboardEvent) => void
        , handleBeforeInput: (e: InputEvent) => void
        , handleInput: (e: Event) => void)
{
    // stop timer
    clearInterval(tmr);

    // hide input & disable event listening for it
    word_input.value = '';
    word_input.classList.add('hidden');
    word_input.removeEventListener('keypress', handleWord);
    word_input.removeEventListener('beforeinput', handleBeforeInput);
    word_input.removeEventListener('input', handleInput);

    for (const letter of letters) {
        letter.dehighlight();
        letter.release();
    }

    // show results
    results.classList.remove('hidden');
    results.classList.add('pending-result');

    queue.deplete(() => { reportResults(results); });
}

function startTimer(minutes: number, letters: Array<LetterWidget>
        , word_input: HTMLInputElement, results: HTMLElement
        , wordHandler: (e: KeyboardEvent) => void
        , beforeInputHandler: (e: InputEvent) => void
        , inputHandler: (e: Event) => void)
{
    const left = document.getElementById('timeleft');
    let sec = Math.floor(minutes * 60);
    left!.textContent = formatTime(sec);

    let tmr = setInterval(() => {
        if (sec === 0) {
            stopTimer(tmr, letters, word_input, results, wordHandler, beforeInputHandler, inputHandler);
            return;
        }
        --sec;
        left!.textContent = formatTime(sec);
    }, 1000);

    return tmr;
}

function publishWord(word: string) {
    if (word.length < 2)
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

function highlightLetter(letter: string, letters: Array<LetterWidget>) {
    for (const letter_widget of letters) {
        if (letter == letter_widget.getLetter() && letter_widget.highlight()) return;
    }
}

function dehighlightLetter(letter: string, letters: Array<LetterWidget>) {
    for (const letter_widget of letters) {
        if (letter == letter_widget.getLetter() && letter_widget.dehighlight()) return;
    }
}

function dehighlightLetters(letters: Array<LetterWidget>) {
    for (const letter of letters) {
        letter.dehighlight();
    }
}

function redoLettersHighlighting(word_input: HTMLInputElement, letters: Array<LetterWidget>) {
    dehighlightLetters(letters);
    const alphas = filterNonAlphabetics(word_input.value);
    for (const alpha of alphas) {
        highlightLetter(alpha, letters);
    }
}

function getWordHandler(letters: Array<LetterWidget>) {
    return (e: KeyboardEvent) => {
        switch(e.key) {
            case "Enter":
                const word_input = e.currentTarget as HTMLInputElement;
                const word_unescaped = new String(word_input.value);
                if (word_input.checkValidity() && word_unescaped.length > 2) {
                    word_input.value = '';
                    dehighlightLetters(letters);
                    const word = escapeRegExp(word_unescaped.toLowerCase());
                    publishWord(word);
                }
                break;
        }
        e.stopPropagation();
    };
}

function getInputHandler(letters: Array<LetterWidget>) {
    return (e: Event) => {
        if ((e as InputEvent).inputType === 'insertText' && (e as InputEvent).data !== null) {
        } else {
            redoLettersHighlighting(e.currentTarget as HTMLInputElement, letters);
        }
    };
}

function getBeforeInputHandler(letters: Array<LetterWidget>) {
    return (e: InputEvent) => {
        const word_input = e.currentTarget as HTMLInputElement;
        const begin = word_input.selectionStart!;
        const end = word_input.selectionEnd!;
        if (e.inputType === "insertText" && e.data !== null && begin !== end) {
            const alphas = filterNonAlphabetics(word_input.value.substring(begin, end));
            for (const alpha of alphas) dehighlightLetter(alpha, letters);
        }
    };
}

function reset() {
    queue = new PromiseQueue();

    const disclaimer = document.getElementById('network-issues-disclaimer') as HTMLElement;
    disclaimer.classList.add('hidden');

    const word_input = document.getElementById('word') as HTMLInputElement;

    const synchronizer = new WordSynchronizer(word_input);

    const letters_div = document.getElementById('letters') as HTMLElement;
    const letters = generateLetters(letters_div, word_input, synchronizer);

    const wordHandler = getWordHandler(letters);
    const inputHandler = getInputHandler(letters);
    const beforeInputHandler = getBeforeInputHandler(letters);

    word_input.classList.remove('hidden');
    word_input.addEventListener('keypress', wordHandler);
    word_input.addEventListener('beforeinput', beforeInputHandler);
    word_input.addEventListener('input', inputHandler);
    word_input.focus();

    const results = document.getElementById('result') as HTMLElement;
    results.classList.add('hidden');
    results.classList.remove('pending-result');

    const scores = document.getElementById('scores') as HTMLElement;
    scores.textContent = '';

    const tmr = startTimer(2, letters, word_input, results, wordHandler, beforeInputHandler, inputHandler);

    const again = document.getElementById('again') as HTMLElement;
    again.addEventListener('click', (event) => {
        queue.deplete(() => { console.log("old queue depleted"); });
        stopTimer(tmr, letters, word_input, results, wordHandler, beforeInputHandler, inputHandler);
        reset();
    }, { once: true } );
}

window.addEventListener('load', function () {
    reset();
});
