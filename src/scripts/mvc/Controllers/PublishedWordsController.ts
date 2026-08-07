import { PublishedWord, createPublishedWordsState } from '../Models/PublishedWordsState.js';
import { PublishedWordsView } from '../Views/PublishedWordsView.js';
import { InputState } from '../Models/InputState.js';

export class PublishedWordsController {
    private view: PublishedWordsView = new PublishedWordsView();
    private state: PublishedWord[];

    constructor(state?: PublishedWord[]) {
        this.state = state ? [...state] : createPublishedWordsState();
    }

    addPublishedWord(word: InputState): void {
        this.state.push({ text: word.text });
        this.view.render(this.state);
    }

    reset() {
        this.state = createPublishedWordsState();
        this.view.render(this.state);
    }
}
