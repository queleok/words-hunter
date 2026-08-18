import { InputView } from '../Views/InputView.js';
import { createInputState, InputState } from '../Models/InputState.js';
import { LanguageState } from '../Models/LanguageState.js';

function spliceReplace(text: string, begin: number, len: number, replacement: string = ''): { remaining: string, removed: string } {
    let splitted = text.split('');
    let spliced = splitted.splice(begin, len, replacement);
    return { remaining: splitted.join(''), removed: spliced.join('') };
}

export class InputController {
    private view: InputView = new InputView('inpt');
    private state: InputState = createInputState();
    private onSubmit?: (published: string) => void;
    private onInsert?: (letter: string, index: number) => void;
    private onRemove?: (letter: string, index: number) => void;

    constructor(allowed: string) {
        this.state.allowed = allowed;
        this.view.getInput().addEventListener('keydown', this.handleKeyDown.bind(this));
        this.view.getInput().addEventListener('beforeinput', this.handleBeforeInput.bind(this));
    }

    setOnSubmit(callback?: (published: string) => void): void {
        this.onSubmit = callback;
    }

    setOnInsert(callback?: (letter: string, index: number) => void) {
        this.onInsert = callback;
    }

    setOnRemove(callback?: (letter: string, index: number) => void) {
        this.onRemove = callback;
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.submit();
        }
    }

    private handleBeforeInput(event: InputEvent): void {
        const inputType = event.inputType;

        const data = event.data?.toLowerCase() || '';

        let begin = this.view.getInput().selectionStart || 0;
        let end = this.view.getInput().selectionEnd? this.view.getInput().selectionEnd! : begin;

        if (begin === end) {
            if (inputType === 'deleteContentBackward') {
                begin = Math.max(0, begin - 1);
            } else if (inputType === 'deleteContentForward') {
                end = Math.min(this.state.text.length, end + 1);
            }
        }

        const len = end - begin;

        // Validate all characters against the language alphabet before processing
        if (!inputType.startsWith('delete')) {
            for (let i = 0; i < data.length; ++i) {
                if (!this.state.allowed.includes(data[i]) && !this.state.allowed.toUpperCase().includes(data[i])) {
                    event.preventDefault();
                    return;
                }
            }
        }

        const spliced = spliceReplace(this.state.text, begin, len, data);
        this.state.text = spliced.remaining;

        if (this.onRemove) {
            for (let i = len; i > 0; --i) this.onRemove(spliced.removed[i - 1], begin + i - 1);
        }

        if (this.onInsert) {
            let position = begin;
            for (const alpha of data) this.onInsert(alpha, position++);
        }
    }

    reset(allowed?: string): void {
        this.state.text = '';

        if (allowed) this.state.allowed = allowed;

        this.view.render(this.state);
    }

    submit(): void {
        const published = this.view.getInput().value.toLowerCase();
        this.reset();
        if (this.onSubmit) {
            this.onSubmit(published);
        }
    }

    append(letter: string): boolean {
        if (this.state.text.length >= 16) return false;

        this.state.text += letter;
        this.view.render(this.state);
        return true;
    }

    remove(index: number): boolean {
        this.state.text = spliceReplace(this.state.text, index, 1).remaining;
        this.view.render(this.state);
        return true;
    }
}
