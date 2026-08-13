import { PublishedWord, PublishedWordStatus } from '../Models/PublishedWord.js';
import { PublishedWordsView } from '../Views/PublishedWordsView.js';
import { InputState } from '../Models/InputState.js';

export class PublishedWordsController {
    private view: PublishedWordsView = new PublishedWordsView();
    private state: PublishedWord[];
    private publishedSet: Set<string>;

    constructor(state?: PublishedWord[]) {
        this.state = state ? [...state] : [];
        this.publishedSet = new Set(this.state.map(w => w.text));
    }

    addPublishedWord(word: string): void {
        if (this.publishedSet.has(word)) {
            const existingIndex = this.state.findIndex((w) => w.text === word);
            if (existingIndex >= 0) {
                this.state.splice(existingIndex, 1);
            }

            this.state.unshift({ text: word, status: 'valid' });
        } else {
            this.state.push({ text: word, status: 'pending' });
            this.publishedSet.add(word);
        }

        this.view.render(this.state);
    }

    reset() {
        this.state = [];
        this.publishedSet.clear();
        this.view.render(this.state);
    }

    getState() {
        return this.state;
    }
}
