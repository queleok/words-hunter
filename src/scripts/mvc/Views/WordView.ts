import { LetterWidget, WordSynchronizer } from '../ui.js';

export class WordView {
    private input: HTMLInputElement;
    private publishButton: HTMLElement;
    private synchronizer: WordSynchronizer;
    private onPublish?: (word: string) => void;

    constructor(
        inputElementId: string,
        publishButtonId: string,
        lettersContainerId: string,
        synchronizer: WordSynchronizer,
        onPublish?: (word: string) => void
    ) {
        this.input = document.getElementById(inputElementId)! as HTMLInputElement;
        this.publishButton = document.getElementById(publishButtonId)!;
        this.synchronizer = synchronizer;
        this.onPublish = onPublish;

        const lettersDiv = document.getElementById(lettersContainerId);
        if (lettersDiv) {
            // Re-initialize letter widgets for the new view
            this.synchronizer.setLettersPublic([...this.input.value]);
        }

        this.setupListeners();
    }

    private setupListeners(): void {
        this.input.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                this.publishWord();
            }
        });

        this.publishButton.addEventListener('click', () => {
            this.publishWord();
        });
    }

    private publishWord(): void {
        const word = this.input.value.trim().toLowerCase();
        if (word.length < 3 || !this.input.checkValidity()) return;

        this.input.value = '';
        this.synchronizer.dehighlightLetters();

        if (this.onPublish) {
            this.onPublish(word);
        } else {
            console.log('Word published:', word);
        }
    }

    release(): void {
        this.input.value = '';
        this.input.parentElement?.classList.add('hidden');
        this.synchronizer.release();
    }
}
