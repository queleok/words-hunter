import { LetterData } from '../Models/LetterData.js';

export class LetterView {
    private container: HTMLElement;

    constructor(selector: string) {
        this.container = document.getElementById(selector) as HTMLElement;
    }

    render(letters: LetterData[]): void {
        // Clear existing children
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        letters.forEach((letter, index) => {
            const cell = document.createElement('div');
            cell.classList.add('cell', 'hbox-nowrap');
            cell.textContent = letter.letter;
            // Store the LetterData on the element for later controller access
            (cell as HTMLElement).dataset.letterIndex = String(index);
            this.container.appendChild(cell);
        });
    }
}
