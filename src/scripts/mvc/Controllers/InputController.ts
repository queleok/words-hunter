import { InputView } from '../Views/InputView.js';
import { createInputState, InputState } from '../Models/InputState.js';

export class InputController {
    private view: InputView = new InputView('inpt');
    private state: InputState = createInputState();
    private onSubmit?: (published: string) => void;

    constructor() {
        this.view.getInput().addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    setOnSubmit(callback?: (published: string) => void): void {
        this.onSubmit = callback;
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.submit();
        }
    }

    reset(): void {
        const state = createInputState();
        this.view.render(state);
    }

    submit(): void {
        const published = this.view.getInput().value;
        this.reset();
        if (this.onSubmit) {
            this.onSubmit(published);
        }
    }
}
