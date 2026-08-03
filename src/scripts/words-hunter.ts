'use strict';

import { generate, shuffle } from './generate-letters.js';
import { formatTime, formatResult, escapeMissingLetters } from './format.js';
import { PromiseQueue, FetchResult, IFetchAdapter, DictionaryFetchAdapter, WiktionaryFetchAdapter } from './queue.js';
import { LetterWidget, WordSynchronizer } from './ui.js';

let freqmap = Array(26).fill(0);
let queue: PromiseQueue;
let validator: IFetchAdapter;
let time_scale = 1.0;
let currentValidatorType: 'dictionary' | 'wiktionary' = 'wiktionary';
let currentLanguage: 'en' | 'sv' = 'en';

declare global {
    interface Window { _puppeteerGetSpeedup: () => Promise<number>; }
}

function generateLetters(letters_div: HTMLElement, synchronizer: WordSynchronizer) {
    letters_div.textContent = '';

    const {alpha_count, letters} = generate();
    freqmap = alpha_count;

    let ret = new Array<LetterWidget>();

    for (const letter of letters) {
        ret.push(new LetterWidget(letter, letters_div, synchronizer));
    }

    return ret;
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

function toggleSettings() {
    const settingsPanel = document.getElementById('settings-panel') as HTMLElement;
    if (settingsPanel) {
        // When opening, initialize pending state to current state
        const validatorSelector = document.getElementById('validator-selector') as HTMLSelectElement;
        validatorSelector.value = currentValidatorType;

        // NEW: Initialize language selector
        const languageSelector = document.getElementById('language-selector') as HTMLSelectElement;
        if (languageSelector) {
            languageSelector.value = currentLanguage;
        }


        settingsPanel.classList.toggle('hidden');
    }
}

function closeSettingsPanel() {
    const settingsPanel = document.getElementById('settings-panel') as HTMLElement;
    if (settingsPanel) {
        settingsPanel.classList.add('hidden');
    }
}

function applyChanges() {
    const settingsPanel = document.getElementById('settings-panel') as HTMLElement;
    if (settingsPanel) {
        closeSettingsPanel();

        // When opening, initialize pending state to current state
        const validatorSelector = document.getElementById('validator-selector') as HTMLSelectElement;
        const selectedValidatorValue = validatorSelector?.value as 'dictionary' | 'wiktionary';

        // NEW: Get language selector value
        const languageSelector = document.getElementById('language-selector') as HTMLSelectElement;
        const selectedLanguage = languageSelector?.value as 'en' | 'sv';

        let changed = false;
        if (selectedValidatorValue && selectedValidatorValue !== currentValidatorType) {
            currentValidatorType = selectedValidatorValue;
            changed = true;
        }

        // NEW: Check and update language state
        if (selectedLanguage && selectedLanguage !== currentLanguage) {
             currentLanguage = selectedLanguage;
             changed = true;
        }

        if (changed) {
            // Since API calls depend on this setting, we must restart the game too.
            const again = document.getElementById('again') as HTMLElement;
            again.click()
        }
    }
}

function initializeSettingsListeners() {
    const settingsPanel = document.getElementById('settings-panel') as HTMLElement;
    if (!settingsPanel) return;

    // 1. Apply button listener
    const applyButton = document.getElementById('apply-changes') as HTMLButtonElement;
    if (applyButton) {
        applyButton.addEventListener('click', applyChanges);
    }

    // 2. Discard/Close button listener
    const closeButton = document.getElementById('discard-changes') as HTMLButtonElement;
    if (closeButton) {
        closeButton.addEventListener('click', closeSettingsPanel);
    }
}

async function reset() {
    if (window.hasOwnProperty('_puppeteerGetSpeedup')) time_scale = 1 / await window._puppeteerGetSpeedup();

    // --- Refactoring Step: Instantiate the desired validator and inject it into PromiseQueue ---
    // We use currentValidatorType which is now committed via applyChanges()
    if (currentValidatorType === 'wiktionary') {
        validator = new WiktionaryFetchAdapter();
    } else {
        validator = new DictionaryFetchAdapter();
    }
    queue = new PromiseQueue(validator, time_scale);

    const disclaimer = document.getElementById('network-issues-disclaimer') as HTMLElement;
    disclaimer.classList.add('hidden');

    const word = document.getElementById('word')!;

    const synchronizer = new WordSynchronizer(word, publishWord);

    const letters_div = document.getElementById('letters') as HTMLElement;
    const letters = generateLetters(letters_div, synchronizer);
    synchronizer.setLetters(letters);

    const shuffler = (e: Event) => {
        const idxs = [...Array(letters_div.children.length).keys()]
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

    // Settings toggle listener
    const settingsToggleBtn = document.getElementById('settings-toggle') as HTMLElement;
    if (settingsToggleBtn) {
        settingsToggleBtn.addEventListener('click', toggleSettings);
    }

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
}

window.addEventListener('load', function () {
    reset();
});
