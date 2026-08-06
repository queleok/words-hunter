import { SettingsController } from './SettingsController.js';
import { ValidatorController } from './ValidatorController.js';
import { LanguageCode, GameConfig, createDefaultConfig } from '../Models/GameConfig.js';

export class SettingsInitializer {
    private settingsController: SettingsController;
    private validatorController: ValidatorController;
    private config: GameConfig;

    constructor() {
        this.config = createDefaultConfig();
        this.settingsController = new SettingsController('language-selector');
        this.validatorController = new ValidatorController(this.config);
    }

    initialize(): void {
        // Restore language from localStorage if available
        const storedLanguage = localStorage.getItem('selectedLanguage') as LanguageCode | null;
        if (storedLanguage && ['en', 'sv'].includes(storedLanguage)) {
            this.config.language = storedLanguage;
            this.settingsController.setConfig(this.config);
        }

        // Initialize validator from URL parameter
        const params = new URLSearchParams(window.location.search);
        const urlValidator = params.get('validator');
        if (urlValidator && ['dictionary', 'wiktionary'].includes(urlValidator)) {
            this.config.validatorType = urlValidator as any;
            this.settingsController.setConfig(this.config);
        }

        // Set up language change listener
        this.settingsController.onLanguageChange((lang: LanguageCode) => {
            this.config.language = lang;
            localStorage.setItem('selectedLanguage', lang);
        });
    }
}
