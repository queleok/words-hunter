import { InputState } from '../Models/InputState.js';

export class InputView {
    private input: HTMLInputElement;

    constructor(id: string) {
        this.input = document.getElementById(id) as HTMLInputElement;
    }

    render(state: InputState): void {
        this.input.value = state.text;
        this.input.setAttribute('pattern', `[${state.allowed}${state.allowed.toUpperCase()}]{3,16}`);
        this.input.setAttribute('minlength', '3');
    }

    getInput(): HTMLInputElement {
        return this.input;
    }
}
