import { AgainView } from '../Views/AgainView.js';

export class AgainController {
    private view: AgainView = new AgainView('again');
    private onAgain?: () => void;

    constructor() {
        this.view.button.addEventListener('click', this.handleAgain.bind(this));
    }

    setOnAgain(callback?: () => void): void {
        this.onAgain = callback;
    }

    handleAgain(): void {
        if (this.onAgain) {
            this.onAgain();
        } else {
            console.log('Play again triggered');
        }
    }
}
