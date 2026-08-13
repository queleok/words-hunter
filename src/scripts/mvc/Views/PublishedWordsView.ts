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
            const div = document.createElement('div');
            div.classList.add('score');

            if (word.status === 'pending') div.classList.add('pending-score');
            else if (word.status === 'valid') div.classList.add('success');
            else if (word.status === 'invalid') div.classList.add('failure');
            else if (word.status === 'stale') div.classList.add('network-failure');

            div.textContent = word.text;
            this.container.appendChild(div);
        });
    }
}
