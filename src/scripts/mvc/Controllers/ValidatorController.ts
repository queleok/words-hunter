import { GameConfig, LanguageCode } from '../Models/GameConfig.js';
import { ValidatorService } from '../Services/ValidatorService.js';
import { DictionaryValidatorService } from '../Services/DictionaryValidatorService.js';
import { WiktionaryValidatorService } from '../Services/WiktionaryValidatorService.js';

export class ValidatorController {
    private validator: ValidatorService;
    private config: GameConfig;

    constructor(config: GameConfig) {
        this.config = config;

        if (this.config.validatorType === 'dictionary') {
            this.validator = new DictionaryValidatorService();
        } else {
            this.validator = new WiktionaryValidatorService(this.config.language);
        }
    }

    getValidator(): ValidatorService {
        return this.validator;
    }
}
