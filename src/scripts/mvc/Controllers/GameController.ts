import { TimerController } from './TimerController.js';
import { AgainController } from './AgainController.js';
import { LetterController } from './LetterController.js';
import { LanguageController } from './LanguageController.js';
import { InputController } from './InputController.js';
import { PublishController } from './PublishController.js';

export class GameController {
    private timer: TimerController = new TimerController();
    private again: AgainController = new AgainController();
    private letters: LetterController = new LetterController();
    private language: LanguageController = new LanguageController();
    private input: InputController = new InputController();
    private publish: PublishController = new PublishController();

    constructor() {
        this.again.setOnAgain(this.reset.bind(this));
        this.language.setOnChange(this.reset.bind(this));
        this.publish.setOnClick(this.input.submit.bind(this.input));
    }

    reset(): void {
        // Restart the game
        this.input.reset();
        this.letters.reset(this.language.getState());
        this.timer.start(2 * 60);
    }
}
