import { InputController } from './InputController.js';

export class InputInitializer {
    private inputController: InputController;

    constructor() {
        this.inputController = new InputController(null as any);
    }

    initialize(): void {
        const input = document.getElementById('inpt') as HTMLInputElement;
        if (!input) return;

        window.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                this.publishWord();
            }
        });

        input.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                this.publishWord();
            }
        });
    }

    private publishWord(): void {
        const input = document.getElementById('inpt') as HTMLInputElement;
        if (!input) return;

        const word = input.value.trim().toLowerCase();
        if (word.length < 3 || !input.checkValidity()) return;

        input.value = '';
    }
}
