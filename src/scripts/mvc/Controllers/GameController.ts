import { TimerController } from './TimerController.js';
import { AgainController } from './AgainController.js';
import { LetterController } from './LetterController.js';
import { LanguageController } from './LanguageController.js';
import { InputController } from './InputController.js';
import { PublishController } from './PublishController.js';
import { PublishedWordsController } from './PublishedWordsController.js';

export class GameController {
    private timer: TimerController = new TimerController();
    private again: AgainController = new AgainController();
    private letters: LetterController = new LetterController();
    private language: LanguageController = new LanguageController();
    private input: InputController = new InputController();
    private publish: PublishController = new PublishController();
    private publishedWords: PublishedWordsController = new PublishedWordsController();

    constructor() {
        this.again.setOnAgain(this.reset.bind(this));
        this.language.setOnChange(this.reset.bind(this));
        this.publish.setOnClick(this.input.submit.bind(this.input));
        this.input.setOnSubmit(() => this.publishedWords.addPublishedWord(this.input.getLastSubmitted()));
    }

    reset(): void {
        // Restart the game
        this.input.reset();
        this.publishedWords.reset();
        this.letters.reset(this.language.getState());
        this.timer.start(2 * 60);
    }
}
