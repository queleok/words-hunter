import { generate } from '../../generate-letters.js';
import { TimerController } from './TimerController.js';
import { AgainController } from './AgainController.js';
import { LetterController } from './LetterController.js';

export class GameController {
    private timer: TimerController = new TimerController();
    private again: AgainController = new AgainController();
    private letters: LetterController = new LetterController();

    constructor() {
        this.again.setOnAgain(this.reset.bind(this));
    }

    private start() {
        // Start timer
        this.timer.start(2 * 60);

        // Render the initial letter grid
        this.letters.reset();
    }

    reset() {
        // Restart the game
        this.start();
    }
}
