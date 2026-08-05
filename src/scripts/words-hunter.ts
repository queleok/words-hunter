'use strict';

import { LanguageCode, generate, shuffle } from './generate-letters.js';
import { formatTime, formatResult, escapeMissingLetters } from './format.js';
import { PromiseQueue, FetchResult, IFetchAdapter, DictionaryFetchAdapter, WiktionaryFetchAdapter } from './queue.js';
import { LetterWidget, WordSynchronizer } from './ui.js';

let freqmap = Array(26).fill(0);
let queue: PromiseQueue;
let validator: IFetchAdapter;
let time_scale = 1.0;
let currentValidatorType: 'dictionary' | 'wiktionary' = 'wiktionary';
let currentLanguage: LanguageCode = 'en';

declare global {
    interface Window { _puppeteerGetSpeedup: () => Promise<number>; }
}

/**
 * Reads the 'validator' query parameter from the URL and sets currentValidatorType.
 */
function initializeValidatorFromUrl(): void {
    const params = new URLSearchParams(window.location.search);
    const urlValidator = params.get('validator');

    if (urlValidator) {
        // Ensure the parsed value is one of our allowed types
        if (urlValidator === 'dictionary' || urlValidator === 'wiktionary') {
            currentValidatorType = urlValidator as 'dictionary' | 'wiktionary';
            console.log(`[WordsHunter] Validator set via URL: ${currentValidatorType}`);
            return;
        }
    }
    // If no valid parameter is found, we keep the default ('wiktionary')
}

function generateLetters(letters_div: HTMLElement, synchronizer: WordSynchronizer) {
    // This function has been removed as requested. The logic is now handled by the WordSynchronizer constructor.
}

function getFetchResultHandler(word: Element) {
    return (fetch_result: FetchResult) => {
        switch (fetch_result) {
            case "success":
                word.setAttribute('class', 'score success');
                word.setAttribute('href', `https://en.wiktionary.org/wiki/${word.textContent}`);
                word.setAttribute('target', '_blank');
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

function stopTimer(tmr: ReturnType<typeof setInterval>
        , results: HTMLElement
        , synchronizer: WordSynchronizer)
{
    // stop timer
    clearInterval(tmr);

    synchronizer.release();

    // show results
    results.classList.remove('hidden');
    results.classList.add('pending-result');

    queue.deplete(() => { reportResults(results); });
}

function startTimer(minutes: number
        , results: HTMLElement
        , synchronizer: WordSynchronizer)
{
    const left = document.getElementById('timeleft');
    let sec = Math.floor(minutes * 60);
    left!.textContent = formatTime(sec);

    let tmr = setInterval(() => {
        if (sec === 0) {
            stopTimer(tmr, results, synchronizer);
            return;
        }
        --sec;
        left!.textContent = formatTime(sec);
    }, 1000 * time_scale);

    return tmr;
}

function publishWord(word: string) {
    if (word.length < 2)
        return;

    const id = 'w_' + word;
    const found_word = document.getElementById(id);
    const scores = document.getElementById('scores') as HTMLElement;
    if (undefined != found_word) {
        scores.removeChild(found_word);
        scores.insertBefore(found_word, scores.firstChild);
        found_word.classList.add('moved');
        setTimeout(() => {
            found_word.classList.remove('moved');
        }, 1000)
        return;
    }

    let published_word = document.createElement('a');
    published_word.classList.add('score');
    published_word.setAttribute('id', id);
    scores.insertBefore(published_word, scores.firstChild);

    const escaped = escapeMissingLetters(word, freqmap, currentLanguage);
    if (escaped === null) {
        published_word.textContent = word;
        published_word.classList.add('pending-score');
        queue.enqueue(word).then(getFetchResultHandler(published_word));
    } else {
        published_word.innerHTML = escaped;
        published_word.classList.add('failure');
    }
}

function applyChanges() {
    // Get language selector value
    const languageSelector = document.getElementById('language-selector') as HTMLSelectElement;
    if (!languageSelector) return;
    
    const selectedLanguage = languageSelector?.value as 'en' | 'sv';

    let changed = false;
    if (selectedLanguage && selectedLanguage !== currentLanguage) {
         currentLanguage = selectedLanguage;
         changed = true;
         // Persist the change to local storage
         localStorage.setItem('selectedLanguage', selectedLanguage);
    }

    if (changed) {
        // Since API calls depend on this setting, we must restart the game too.
        const again = document.getElementById('again') as HTMLElement;
        again.click()
    }
}

function initializeSettingsListeners() {
    // 1. Language selector change listener
    const languageSelector = document.getElementById('language-selector') as HTMLSelectElement;
    if (languageSelector) {
        languageSelector.addEventListener('change', applyChanges);
    }
}

async function reset() {
    // Check localStorage for saved language preference
    const storedLanguage = localStorage.getItem('selectedLanguage') as LanguageCode | null;
    if (storedLanguage && ['en', 'sv'].includes(storedLanguage)) {
        currentLanguage = storedLanguage;

        const languageSelector = document.getElementById('language-selector') as HTMLSelectElement;
        languageSelector.value = currentLanguage;
    }

    if (window.hasOwnProperty('_puppeteerGetSpeedup')) time_scale = 1 / await window._puppeteerGetSpeedup();

    // Initialize validator from URL before generating letters/config
    initializeValidatorFromUrl();

    const generated = generate(currentLanguage);
    freqmap = generated.alpha_count;

    if (currentValidatorType === 'wiktionary') {
        validator = new WiktionaryFetchAdapter(generated.config.name);
    } else {
        validator = new DictionaryFetchAdapter();
    }
    queue = new PromiseQueue(validator, time_scale);

    const disclaimer = document.getElementById('network-issues-disclaimer') as HTMLElement;
    disclaimer.classList.add('hidden');

    // Pass the language configuration and generated letters to the synchronizer
    const synchronizer = new WordSynchronizer(publishWord, generated.config, generated.letters);

    const shuffler = (e: Event) => {
        const letters_div = document.getElementById('letters') as HTMLElement;
        const idxs = [...Array(letters_div.children?.length || 0).keys()]
        shuffle(idxs);

        // NOTE: childNodes is a live list, hence we can't use it directly
        const children = letters_div.childNodes;

        let sorted_children = new Array<Node>();
        for (const idx of idxs) {
            sorted_children.push(children[idx]);
        }

        for (const child of sorted_children) {
            letters_div.appendChild(child);
        }
        e.stopPropagation();
    }
    const shuffle_btn = document.getElementById('shuffle') as HTMLElement;
    shuffle_btn.addEventListener('click', shuffler);

    // Settings toggle listener removed

    const results = document.getElementById('result') as HTMLElement;
    results.classList.add('hidden');
    results.classList.remove('pending-result');

    const scores = document.getElementById('scores') as HTMLElement;
    scores.textContent = '';

    const tmr = startTimer(2, results, synchronizer);

    const again = document.getElementById('again') as HTMLElement;
    again.addEventListener('click', (event) => {
        queue.deplete(() => { console.log("old queue depleted"); });
        stopTimer(tmr, results, synchronizer);
        shuffle_btn.removeEventListener('click', shuffler);
        reset();
    }, { once: true } );

    // Initialize settings listeners after all elements are available
    initializeSettingsListeners();

    const input = document.getElementById('inpt') as HTMLElement;
    input.focus();
}

window.addEventListener('load', function () {
    reset();
});
