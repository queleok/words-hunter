import { GameConfig } from '../Models/GameConfig.js';
import { LanguageCode } from '../../generate-letters.js';
export class SettingsView {
    private languageSelector: HTMLSelectElement;
    private networkDisclaimer: HTMLElement;
    private onLanguageChange?: (lang: LanguageCode) => void;

    constructor(languageSelectorId: string, disclaimerId: string) {
        this.languageSelector = document.getElementById(languageSelectorId)! as HTMLSelectElement;
        this.networkDisclaimer = document.getElementById(disclaimerId)!;
    }

    setConfig(config: GameConfig): void {
        if (this.onLanguageChange) {
            const currentLang = this.languageSelector.value as LanguageCode;
            if (currentLang !== config.language) {
                this.onLanguageChange(config.language);
            }
        }
    }

    showNetworkDisclaimer(): void {
        this.networkDisclaimer.classList.remove('hidden');
    }

    hideNetworkDisclaimer(): void {
        this.networkDisclaimer.classList.add('hidden');
    }
}
