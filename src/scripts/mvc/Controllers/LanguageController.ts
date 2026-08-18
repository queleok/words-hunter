import { LanguageCode, LanguageState, createLanguageState } from '../Models/LanguageState.js';
import { LanguageView } from '../Views/LanguageView.js';

export class LanguageController {
    private view: LanguageView = new LanguageView('language-selector');
    private state: LanguageState;
    private onChange?: () => void;

    constructor(code: LanguageCode = 'en') {
        this.state = createLanguageState(code);
        this.view.render(this.state.code);
        this.view.getSelector().addEventListener('change', this.handleChange.bind(this));
    }

    private handleChange(): void {
        this.state = createLanguageState(this.view.getSelectedCode());

        if (this.onChange) {
            this.onChange();
        }
    }

    setOnChange(callback?: () => void): void {
        this.onChange = callback;
    }

    getState(): LanguageState {
        return this.state;
    }
}
