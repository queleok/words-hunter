import { LanguageCode } from '../Models/LanguageState.js';
import { LanguageView } from '../Views/LanguageView.js';

export class LanguageController {
    private view: LanguageView = new LanguageView('language-selector');
    private state: LanguageCode;
    private onChange?: () => void;

    constructor(state: LanguageCode = 'en') {
        this.state = state;
        this.view.render(this.state);
        this.view.getSelector().addEventListener('change', this.handleChange.bind(this));
    }

    private handleChange(): void {
        this.state = this.view.getSelectedCode();

        if (this.onChange) {
            this.onChange();
        }
    }

    setOnChange(callback?: () => void): void {
        this.onChange = callback;
    }

    getState(): LanguageCode {
        return this.state;
    }
}
