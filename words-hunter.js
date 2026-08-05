'use strict';
import { generate, shuffle } from './generate-letters.js';
import { formatTime, formatResult, escapeMissingLetters } from './format.js';
import { PromiseQueue, DictionaryFetchAdapter, WiktionaryFetchAdapter } from './queue.js';
import { WordSynchronizer } from './ui.js';
let freqmap = Array(26).fill(0);
let queue;
let validator;
let time_scale = 1.0;
let currentValidatorType = 'wiktionary';
let currentLanguage = 'en';
/**
 * Reads the 'validator' query parameter from the URL and sets currentValidatorType.
 */
function initializeValidatorFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const urlValidator = params.get('validator');
    if (urlValidator) {
        // Ensure the parsed value is one of our allowed types
        if (urlValidator === 'dictionary' || urlValidator === 'wiktionary') {
            currentValidatorType = urlValidator;
            console.log(`[WordsHunter] Validator set via URL: ${currentValidatorType}`);
            return;
        }
    }
    // If no valid parameter is found, we keep the default ('wiktionary')
}
function generateLetters(letters_div, synchronizer) {
    // This function has been removed as requested. The logic is now handled by the WordSynchronizer constructor.
}
function getFetchResultHandler(word) {
    return (fetch_result) => {
        switch (fetch_result) {
            case "success":
                word.setAttribute('class', 'score success');
                word.setAttribute('href', validator.getReferenceUrl(word.textContent));
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
    }, 1000 * time_scale);
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
        scores.insertBefore(found_word, scores.firstChild);
        found_word.classList.add('moved');
        setTimeout(() => {
            found_word.classList.remove('moved');
        }, 1000);
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
    }
    else {
        published_word.innerHTML = escaped;
        published_word.classList.add('failure');
    }
}
function applyChanges() {
    // Get language selector value
    const languageSelector = document.getElementById('language-selector');
    if (!languageSelector)
        return;
    const selectedLanguage = languageSelector === null || languageSelector === void 0 ? void 0 : languageSelector.value;
    let changed = false;
    if (selectedLanguage && selectedLanguage !== currentLanguage) {
        currentLanguage = selectedLanguage;
        changed = true;
        // Persist the change to local storage
        localStorage.setItem('selectedLanguage', selectedLanguage);
    }
    if (changed) {
        // Since API calls depend on this setting, we must restart the game too.
        const again = document.getElementById('again');
        again.click();
    }
}
function initializeSettingsListeners() {
    // 1. Language selector change listener
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.addEventListener('change', applyChanges);
    }
}
async function reset() {
    // Check localStorage for saved language preference
    const storedLanguage = localStorage.getItem('selectedLanguage');
    if (storedLanguage && ['en', 'sv'].includes(storedLanguage)) {
        currentLanguage = storedLanguage;
        const languageSelector = document.getElementById('language-selector');
        languageSelector.value = currentLanguage;
    }
    if (window.hasOwnProperty('_puppeteerGetSpeedup'))
        time_scale = 1 / await window._puppeteerGetSpeedup();
    // Initialize validator from URL before generating letters/config
    initializeValidatorFromUrl();
    const generated = generate(currentLanguage);
    freqmap = generated.alpha_count;
    if (currentValidatorType === 'wiktionary') {
        validator = new WiktionaryFetchAdapter(generated.config.name);
    }
    else {
        validator = new DictionaryFetchAdapter();
    }
    queue = new PromiseQueue(validator, time_scale);
    const disclaimer = document.getElementById('network-issues-disclaimer');
    disclaimer.classList.add('hidden');
    // Pass the language configuration and generated letters to the synchronizer
    const synchronizer = new WordSynchronizer(publishWord, generated.config, generated.letters);
    const shuffler = (e) => {
        var _a;
        const letters_div = document.getElementById('letters');
        const idxs = [...Array(((_a = letters_div.children) === null || _a === void 0 ? void 0 : _a.length) || 0).keys()];
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
    // Settings toggle listener removed
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
    // Initialize settings listeners after all elements are available
    initializeSettingsListeners();
    const input = document.getElementById('inpt');
    input.focus();
}
window.addEventListener('load', function () {
    reset();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZHMtaHVudGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NjcmlwdHMvd29yZHMtaHVudGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sRUFBZ0IsUUFBUSxFQUFFLE9BQU8sRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQ3hFLE9BQU8sRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQzdFLE9BQU8sRUFBRSxZQUFZLEVBQThCLHNCQUFzQixFQUFFLHNCQUFzQixFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ3RILE9BQU8sRUFBZ0IsZ0JBQWdCLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFFekQsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQyxJQUFJLEtBQW1CLENBQUM7QUFDeEIsSUFBSSxTQUF3QixDQUFDO0FBQzdCLElBQUksVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUNyQixJQUFJLG9CQUFvQixHQUFnQyxZQUFZLENBQUM7QUFDckUsSUFBSSxlQUFlLEdBQWlCLElBQUksQ0FBQztBQU16Qzs7R0FFRztBQUNILFNBQVMsMEJBQTBCO0lBQy9CLE1BQU0sTUFBTSxHQUFHLElBQUksZUFBZSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDM0QsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUU3QyxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQ2Ysc0RBQXNEO1FBQ3RELElBQUksWUFBWSxLQUFLLFlBQVksSUFBSSxZQUFZLEtBQUssWUFBWSxFQUFFLENBQUM7WUFDakUsb0JBQW9CLEdBQUcsWUFBMkMsQ0FBQztZQUNuRSxPQUFPLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxvQkFBb0IsRUFBRSxD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