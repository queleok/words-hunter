import { generateLetters } from '../Models/LetterData.js';
import { LetterView } from '../Views/LetterView.js';

export class LetterController {
    private view: LetterView = new LetterView('letters');

    reset(): void {
        const letters = generateLetters();
        this.view.render(letters);
    }
}
