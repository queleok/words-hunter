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
                word.setAttribute('href', `https://api.dictionaryapi.dev/api/v2/entries/en/${word.textContent}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZHMtaHVudGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NjcmlwdHMvd29yZHMtaHVudGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDMUQsT0FBTyxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDN0UsT0FBTyxFQUFFLFlBQVksRUFBZSxNQUFNLFlBQVksQ0FBQztBQUN2RCxPQUFPLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sU0FBUyxDQUFDO0FBRXpELElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztBQUUvQixTQUFTLGVBQWUsQ0FBQyxXQUF3QixFQUFFLFlBQThCO0lBQzdFLFdBQVcsQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0lBRTdCLE1BQU0sRUFBQyxXQUFXLEVBQUUsT0FBTyxFQUFDLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDMUMsT0FBTyxHQUFHLFdBQVcsQ0FBQztJQUV0QixJQUFJLEdBQUcsR0FBRyxJQUFJLEtBQUssRUFBZ0IsQ0FBQztJQUVwQyxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTtRQUMxQixHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksWUFBWSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztLQUNqRTtJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsSUFBYTtJQUN4QyxPQUFPLENBQUMsWUFBeUIsRUFBRSxFQUFFO1FBQ2pDLFFBQVEsWUFBWSxFQUFFO1lBQ2xCLEtBQUss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