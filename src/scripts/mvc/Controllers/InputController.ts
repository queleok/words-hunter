import { InputView } from '../Views/InputView.js';
import { createInputState, InputState } from '../Models/InputState.js';

export class InputController {
    private view: InputView = new InputView('inpt');
    private onSubmit?: () => void;

    constructor() {
        this.view.getInput().addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    setOnSubmit(callback?: () => void): void {
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

    private submit(): void {
        this.reset();
        if (this.onSubmit) {
            this.onSubmit();
        }
    }
}
