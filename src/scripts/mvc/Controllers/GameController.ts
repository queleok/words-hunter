import { TimerController } from './TimerController.js';
import { AgainController } from './AgainController.js';
import { LetterController } from './LetterController.js';
import { LanguageController } from './LanguageController.js';
import { InputController } from './InputController.js';
import { PublishController } from './PublishController.js';
import { PublishedWordsController } from './PublishedWordsController.js';
import { ResultController } from './ResultController.js';

export class GameController {
    private timer: TimerController = new TimerController();
    private again: AgainController = new AgainController();
    private letters: LetterController = new LetterController();
    private language: LanguageController = new LanguageController();
    private input: InputController = new InputController();
    private publish: PublishController = new PublishController();
    private publishedWords: PublishedWordsController = new PublishedWordsController();
    private result: ResultController = new ResultController();

    constructor() {
        this.again.setOnAgain(this.reset.bind(this));
        this.language.setOnChange(this.reset.bind(this));
        this.publish.setOnClick(() => this.input.submit());
        this.input.setOnSubmit(this.publishedWords.addPublishedWord.bind(this.publishedWords));
        this.timer.setOnEnd(() => this.result.end(this.publishedWords.getState()));
    }

    reset(): void {
        // Restart the game
        this.result.reset();
        this.input.reset();
        this.publishedWords.reset();
        this.letters.reset(this.language.getState());
        this.timer.start(2 * 60);
    }
}
