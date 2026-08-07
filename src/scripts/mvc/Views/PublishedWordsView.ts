import { PublishedWord } from '../Models/PublishedWordsState.js';

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
            div.textContent = word.text;
            this.container.appendChild(div);
        });
    }
}
