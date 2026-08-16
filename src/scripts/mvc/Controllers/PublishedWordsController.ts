import { PublishedWord, PublishedWordStatus } from '../Models/PublishedWord.js';
import { PublishedWordsView } from '../Views/PublishedWordsView.js';
import { InputState } from '../Models/InputState.js';
import { ValidationResult } from '../Models/ValidationResult.js';

export class PublishedWordsController {
    private view: PublishedWordsView = new PublishedWordsView();
    private state: PublishedWord[];
    private publishedSet: Set<string>;
    private pendingCount: number = 0;
    private onAllResolved?: (words: PublishedWord[]) => void;

    constructor(state?: PublishedWord[]) {
        this.state = state ? [...state] : [];
        this.publishedSet = new Set(this.state.map(w => w.text));
        this.pendingCount = this.state.filter((w) => w.status === 'pending').length;
    }

    addInvalidPublishedWord(word: string): void {
        this.addWordImpl(word, 'invalid');
    }

    addPendingPublishedWord(word: string): void {
        if (this.addWordImpl(word, 'pending')) ++this.pendingCount;
    }

    private addWordImpl(word: string, status: PublishedWordStatus): boolean {
        let found = this.publishedSet.has(word);
        if (found) {
            const existingIndex = this.state.findIndex((w) => w.text === word);
            if (existingIndex >= 0) {
                status = this.state.splice(existingIndex, 1)[0].status;
            }
        } else {
            this.publishedSet.add(word);
        }

        this.state.unshift({ text: word, status: status });

        this.view.render(this.state);

        return !found;
    }

    reset() {
        this.state = [];
        this.publishedSet.clear();
        this.pendingCount = 0;
        this.view.render(this.state);
    }

    handleValidationResult(result: ValidationResult) {
        const found = this.state.findIndex((w) => w.text === result.word);
        if (found < 0) return;

        const oldStatus = this.state[found].status;
        this.state[found].status = result.status;

        // Update pending count when a word transitions out of 'pending'
        if (oldStatus === 'pending') {
            --this.pendingCount;
            if (this.pendingCount <= 0 && this.onAllResolved) {
                this.onAllResolved(this.state);
            }
        }

        this.view.render(this.state);
    }

    setOnAllResolved(callback?: (words: PublishedWord[]) => void): void {
        this.onAllResolved = callback;
        if (this.pendingCount <= 0 && this.onAllResolved) {
            this.onAllResolved(this.state);
        }
    }

    getPendingCount(): number {
        return this.pendingCount;
    }
}
