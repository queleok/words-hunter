import { generate } from '../../generate-letters.js';
import { WordSynchronizer } from '../ui.js';
import { GameConfig, createDefaultConfig } from '../Models/GameConfig.js';
import { GameState, PublishedWord, resetState, stopState } from '../Models/GameState.js';
import { ValidatorService } from '../Services/ValidatorService.js';
import { DictionaryValidatorService } from '../Services/DictionaryValidatorService.js';
import { WiktionaryValidatorService } from '../Services/WiktionaryValidatorService.js';
import { TimerView } from '../Views/TimerView.js';
import { ScoreView } from '../Views/ScoreView.js';
import { WordView } from '../Views/WordView.js';
import { SettingsView } from '../Views/SettingsView.js';
import { InputController } from './InputController.js';

export class GameController {
    private config: GameConfig = createDefaultConfig();
    private state: GameState;
    private validatorService: ValidatorService;
    private timerView: TimerView | null = null;
    private scoreView: ScoreView | null = null;
    private wordView: WordView | null = null;
    private settingsView: SettingsView | null = null;
    private inputController: InputController;

    constructor(config: GameConfig) {
        this.config = config;
        this.state = resetState({
            wordBuffer: '',
            publishedWords: [],
            timerSeconds: this.config.timeLimitMinutes * 60,
            isRunning: true,
            shuffled: false
        });

        // Initialize validator service based on config
        if (this.config.validatorType === 'dictionary') {
            this.validatorService = new DictionaryValidatorService();
        } else {
            this.validatorService = new WiktionaryValidatorService(this.config.language);
        }

        // Initialize views
        const timerDisplay = document.getElementById('timeleft');
        if (timerDisplay) {
            this.timerView = new TimerView(timerDisplay);
        }

        const scoresContainer = document.getElementById('scores');
        if (scoresContainer) {
            this.scoreView = new ScoreView(scoresContainer);
        }

        this.settingsView = new SettingsView('language-selector', 'network-issues-disclaimer');

        // Initialize input controller
        this.inputController = new InputController(
            null as any,
            (word: string) => this.publishWord(word)
        );
    }

    async start(): Promise<void> {
        const input = document.getElementById('inpt') as HTMLInputElement;
        if (!input) return;

        // Generate letters and initialize synchronizer
        const generated = generate(this.config.language);
        const synchronizer = new WordSynchronizer(
            (word: string) => this.publishWord(word),
            generated.config,
            generated.letters
        );

        // Set up the word view with the synchronizer
        this.wordView = new WordView('inpt', 'publish', 'letters', synchronizer);

        // Start timer
        if (this.timerView) {
            const speedup = 1;
            this.timerView.start(this.state.timerSeconds, speedup);
        }

        // Focus input
        input.focus();
    }

    async publishWord(word: string): Promise<void> {
        if (word.length < 3) return;

        // Validate the word using the validator service
        const result = await this.validatorService.validate(word);

        // Create a published word record
        const id = 'w_' + word;
        const publishedWord: PublishedWord = {
            text: word,
            id: id,
            isValidated: true,
            fetchResult: result
        };

        this.state.publishedWords.push(publishedWord);

        // Update score view
        if (this.scoreView) {
            this.scoreView.appendPublished(publishedWord);
        }

        console.log(`Word published: ${word} - Result: ${result}`);
    }

    async reset(): Promise<void> {
        // Stop timer
        if (this.timerView) {
            this.timerView.stop();
        }

        // Release current state
        this.state = stopState(this.state);

        // Reset views
        if (this.scoreView) {
            this.scoreView.clear();
        }

        // Re-initialize with fresh config and state
        this.config = createDefaultConfig();
        this.state = resetState({
            wordBuffer: '',
            publishedWords: [],
            timerSeconds: this.config.timeLimitMinutes * 60,
            isRunning: true,
            shuffled: false
        });

        if (this.config.validatorType === 'dictionary') {
            this.validatorService = new DictionaryValidatorService();
        } else {
            this.validatorService = new WiktionaryValidatorService(this.config.language);
        }

        // Restart the game
        await this.start();
    }

    stop(): void {
        if (this.timerView) {
            this.timerView.stop();
        }
        if (this.inputController) {
            this.inputController.release();
        }
    }
}
