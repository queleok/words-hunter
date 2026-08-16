import { TimerController } from './TimerController.js';
import { ButtonController } from './ButtonController.js';
import { LetterController } from './LetterController.js';
import { LanguageController } from './LanguageController.js';
import { InputController } from './InputController.js';
import { PublishController } from './PublishController.js';
import { PublishedWordsController } from './PublishedWordsController.js';
import { ResultController } from './ResultController.js';
import { ValidationService } from '../Services/ValidationService.js';
import { ValidationResult } from '../Models/ValidationResult.js';

export class GameController {
    private timer: TimerController = new TimerController();
    private again: ButtonController = new ButtonController('again');
    private shuffle: ButtonController = new ButtonController('shuffle');
    private letters: LetterController = new LetterController();
    private language: LanguageController = new LanguageController();
    private input: InputController = new InputController();
    private publish: PublishController = new PublishController();
    private publishedWords: PublishedWordsController = new PublishedWordsController();
    private result: ResultController = new ResultController();

    private validator: ValidationService = new ValidationService();

    constructor() {
        this.again.setOnClick(this.reset.bind(this));
        this.shuffle.setOnClick(() => {
            this.input.reset();
            this.letters.shuffle();
        });

        this.language.setOnChange(this.reset.bind(this));

        this.publish.setOnClick(() => this.input.submit());

        this.rewire();

        this.timer.setOnEnd(() => {
            this.letters.deactivateAll();
            this.letters.setAppend();
            this.letters.setRemove();
            this.input.setOnInsert();
            this.input.setOnRemove();
            this.input.setOnSubmit();

            this.result.show();

            this.publishedWords.setOnAllResolved(this.result.end.bind(this.result));
        });
    }

    private rewire(): void {
        this.publishedWords.setOnAllResolved();

        this.input.setOnSubmit((word: string) => {
            const withCapitalizedGaps = this.letters.capitalizeGaps();
            this.letters.deactivateAll();

            if (word != withCapitalizedGaps) {
                this.publishedWords.addInvalidPublishedWord(withCapitalizedGaps);
                return;
            }

            this.publishedWords.addPendingPublishedWord(word);
            this.validator.validate(word)
                .then(this.publishedWords.handleValidationResult.bind(this.publishedWords))
                .catch((e) => { console.log(`Caught error: ${e}`); });
        });
        this.input.setOnInsert(this.letters.activate.bind(this.letters));
        this.input.setOnRemove(this.letters.deactivate.bind(this.letters));

        this.letters.setAppend(this.input.append.bind(this.input));
        this.letters.setRemove(this.input.remove.bind(this.input));
    }

    reset(): void {
        // Restart the game
        this.validator.reset();

        this.result.reset();
        this.input.reset();
        this.publishedWords.reset();
        this.letters.reset(this.language.getState());

        this.rewire();

        this.letters.setAppend(this.input.append.bind(this.input));
        this.letters.setRemove(this.input.remove.bind(this.input));

        this.timer.start(2 * 60);
    }
}
