import { generate } from '../../generate-letters.js';
import { TimerController } from './TimerController.js';
import { AgainController } from './AgainController.js';

export class GameController {
    private timer: TimerController = new TimerController();
    private again: AgainController = new AgainController();

    constructor() {
        this.again.setOnAgain(this.reset.bind(this));
    }

    private start() {
        // Generate letters and initialize synchronizer
        const generated = generate('en');

        // Start timer
        this.timer.start(2 * 60);
    }

    reset() {
        // Restart the game
        this.start();
    }
}
