import { LetterWidget, WordSynchronizer } from '../ui.js';

export class InputController {
    private synchronizer: WordSynchronizer;
    private onPublish?: (word: string) => void;

    constructor(synchronizer: WordSynchronizer, onPublish?: (word: string) => void) {
        this.synchronizer = synchronizer;
        this.onPublish = onPublish;
    }

    handleWordInput(event: Event): void {
        const input = document.getElementById('inpt') as HTMLInputElement;
        if (!input) return;

        const ie = event as InputEvent;
        if (ie.inputType === 'insertText' && ie.data !== null) {
            for (const alpha of ie.data.toLowerCase()) {
                this.synchronizer.highlightLetter(alpha);
            }
        } else if (ie.inputType !== 'deleteContentBackward' && ie.inputType !== 'deleteContentForward') {
            this.redoHighlighting();
        }
    }

    handleBeforeInput(event: InputEvent): void {
        const input = document.getElementById('inpt') as HTMLInputElement;
        if (!input) return;

        const begin = input.selectionStart!;
        const end = input.selectionEnd!;
        this.synchronizer.setCursor(begin);

        let spliceStart = 0;
        let spliceLength = 0;

        if (event.inputType.startsWith('insert')) {
            if (begin !== end) {
                spliceStart = begin;
                spliceLength = end - begin;
            }
        } else if (event.inputType.startsWith('delete')) {
            if (begin !== end) {
                spliceStart = begin;
                spliceLength = end - begin;
            } else if (event.inputType === 'deleteContentBackward' && begin > 0) {
                spliceStart = begin - 1;
                spliceLength = 1;
            } else if (event.inputType === 'deleteContentForward' && begin < input.value.length) {
                spliceStart = begin;
                spliceLength = 1;
            }
        }

        if (spliceLength > 0) {
            const removed = this.synchronizer.getWord().splice(spliceStart, spliceLength);
            for (const placeholder of removed) {
                if (!placeholder.widget) continue;
                placeholder.widget.dehighlight();
                this.evaluateRehighlighting(placeholder.widget);
            }
        }
    }

    private redoHighlighting(): void {
        this.synchronizer.dehighlightLetters();
        const input = document.getElementById('inpt') as HTMLInputElement;
        if (!input) return;
        for (const symbol of input.value.toLowerCase()) {
            this.synchronizer.highlightLetter(symbol);
        }
    }

    private evaluateRehighlighting(widget: LetterWidget): void {
        // Re-evaluate highlighting after removal/reinsertion
        const input = document.getElementById('inpt') as HTMLInputElement;
        if (!input) return;
        for (const alpha of input.value.toLowerCase()) {
            this.synchronizer.highlightLetter(alpha);
        }
    }

    release(): void {
        this.synchronizer.release();
    }
}
