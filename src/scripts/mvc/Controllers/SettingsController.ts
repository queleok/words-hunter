import { GameConfig, LanguageCode } from '../Models/GameConfig.js';

export class SettingsController {
    private languageSelector: HTMLSelectElement;
    private onLanguageChangeCb?: (lang: LanguageCode) => void;

    constructor(languageSelectorId: string) {
        this.languageSelector = document.getElementById(languageSelectorId)! as HTMLSelectElement;
    }

    setConfig(config: GameConfig): void {
        if (this.onLanguageChangeCb && config.language !== this.languageSelector.value) {
            this.onLanguageChangeCb(config.language);
        }
    }

    onLanguageChange(callback?: (lang: LanguageCode) => void): void {
        this.onLanguageChangeCb = callback;
    }
}
