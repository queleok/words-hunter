import { TimerController } from './TimerController.js';
import { AgainController } from './AgainController.js';
import { LetterController } from './LetterController.js';
import { LanguageController } from './LanguageController.js';

export class GameController {
    private timer: TimerController = new TimerController();
    private again: AgainController = new AgainController();
    private letters: LetterController = new LetterController();
    private language: LanguageController = new LanguageController();

    constructor() {
        this.again.setOnAgain(this.reset.bind(this));
        this.language.setOnChange(this.reset.bind(this));
    }

    reset(): void {
        // Restart the game
        this.timer.start(2 * 60);
        this.letters.reset(this.language.getState());
    }
}
