import { InputState } from '../Models/InputState.js';

export class InputView {
    private input: HTMLInputElement;

    constructor(id: string) {
        this.input = document.getElementById(id) as HTMLInputElement;
    }

    render(state: InputState): void {
        this.input.value = state.text;
    }

    getInput(): HTMLInputElement {
        return this.input;
    }
}
