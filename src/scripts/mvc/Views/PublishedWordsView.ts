import { PublishedWord } from '../Models/PublishedWord.js';

export class PublishedWordsView {
    private container: HTMLElement;

    constructor() {
        this.container = document.getElementById('scores') as HTMLElement;
    }

    render(words: PublishedWord[]): void {
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        words.forEach((word) => {
            const a = document.createElement('a');
            a.classList.add('score');

            if (word.status === 'pending') a.classList.add('pending-score');
            else if (word.status === 'valid') a.classList.add('success');
            else if (word.status === 'invalid') a.classList.add('failure');
            else if (word.status === 'stale') a.classList.add('network-failure');

            if (word.status === 'invalid') {
                const content = word.text.split('').map((chr) => {
                    if (chr === chr.toUpperCase()) return `<s>${chr.toLowerCase()}</s>`;
                    return chr;
                }).join('');
                a.innerHTML = content;
            } else if (word.status === 'valid') {
                a.href = word.referenceUrl || '';
                a.textContent = word.text;
                a.target = '_blank';
            } else {
                a.textContent = word.text;
            }

            this.container.appendChild(a);
        });
    }
}
