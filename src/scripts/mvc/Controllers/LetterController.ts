import { generateLetters } from '../Models/LetterData.js';
import { LetterView } from '../Views/LetterView.js';
import { LanguageCode } from '../Models/LanguageState.js';

export class LetterController {
    private view: LetterView = new LetterView('letters');

    reset(lang: LanguageCode): void {
        const letters = generateLetters(lang);
        this.view.render(letters);
    }
}
