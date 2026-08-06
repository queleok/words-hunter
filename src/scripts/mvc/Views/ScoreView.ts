import { PublishedWord } from '../Models/GameState.js';

export class ScoreView {
    private container: HTMLElement;

    constructor(containerElement: HTMLElement) {
        this.container = containerElement;
    }

    appendPublished(word: PublishedWord): void {
        const link = document.createElement('a');
        link.classList.add('score');
        link.setAttribute('id', word.id);

        link.textContent = word.text;

        if (word.fetchResult === 'success') {
            link.classList.add('success');
        } else if (word.fetchResult === 'validation-failure') {
            link.classList.add('failure');
        } else if (word.fetchResult === 'no-definition') {
            link.classList.add('failure');
        } else {
            link.classList.add('pending-score');
        }

        this.container.insertBefore(link, this.container.firstChild);
    }

    removePublished(id: string): void {
        const existing = document.getElementById(id);
        if (existing) {
            this.container.removeChild(existing);
        }
    }

    clear(): void {
        this.container.textContent = '';
    }
}
