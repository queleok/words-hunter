'use strict';

import { generate } from './generate-letters.js';
import { formatTime, formatResult, escapeMissingLetters, escapeRegExp, filterNonAlphabetics } from './format.js';

let freqmap = Array(26).fill(0);

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

type Item = {
    word: string,
    published_word: Element
}

type Node = {
    item: Item,
    next: Node | null
}

const queue = {
    begin: null as Node | null,
    end: null as Node | null,
    length: 0,
    enqueue: function(item: Item) {
        const node: Node | null = {
            item: item,
            next: null
        };
        if (this.begin === null) {
            this.begin = node;
            this.end = this.begin;
        } else {
            this.end!.next = node;
            this.end = this.end!.next;
        }
        this.length++;

        if (this.length === 1) tryFetch(this.begin.item.word, this.begin.item.published_word, 2);
    },
    dequeue: function() {
        if (this.length === 0) {
            console.log('attempt to dequeue empty queue');
            return;
        }

        if (this.length === 1) {
            this.clear();
            const results = document.getElementById('result');
            if (results!.classList.contains('pending-result')) reportResults();
            return;
        }

        this.length--;
        this.begin = this.begin!.next;
        tryFetch(this.begin!.item.word, this.begin!.item.published_word, 2);
    },
    clear: function() {
        this.begin = null;
        this.end = null;
        this.length = 0;
    }
};

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

        queue.enqueue({ word: '' + word.textContent, published_word: word });
    }

    e.stopPropagation();
}

function reportResults() {
    let res = 0;
    const successElements = document.getElementsByClassName('success');
    for (const element of successElements) {
        const word = element.textContent;
        res += word!.length - 2;
    }
    const results = document.getElementById('result');
    results!.classList.remove('pending-result');
    results!.textContent = 'Result: ' + formatResult(res);

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

    if (queue.length === 0) {
        reportResults();
    } else {
        results!.classList.add('pending-result');
    }
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

interface Definition {
    definition: string
}

interface Meaning {
    partOfSpeech: string,
    definitions: Array<Definition>
}

interface Word {
    meanings: Array<Meaning>
}

function validateWord(words: Array<Word>) {
    const is_there_non_abbreviation = words.some( (word: Word) =>
        word.meanings.length == 0 
        || !word.meanings.every( meaning =>
            (meaning.partOfSpeech == "abbreviation")
            || meaning.definitions.every( def =>
                def.definition.startsWith("short for "))));
    return is_there_non_abbreviation;
}

function tryFetch(word: string, published_word: Element, attempts: number) {
    setTimeout(() => {
            fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word)
                .then(function(response) {
                    if (response.ok) {
                        return response.json();
                   } else if (response.status === 404) {
                        return Promise.reject(404);
                    } else if (attempts <= 0) {
                        return Promise.reject(response.status);
                    } else
                        tryFetch(word, published_word, --attempts);
                    return null;
                })
                .then(function(data) {
                    if (data === null) {
                        return;
                    } else if (validateWord(data)) {
                        published_word.setAttribute('class', 'score success');
                        queue.dequeue();
                    } else {
                        return Promise.reject(404);
                    }
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
        queue.enqueue({ word: word, published_word: published_word });
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
    queue.clear();

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
