import { LanguageCode } from '../Models/LanguageState.js';

export class LanguageView {
    private select: HTMLSelectElement;

    constructor(id: string) {
        this.select = document.getElementById(id) as HTMLSelectElement;
    }

    render(state: LanguageCode): void {
        const current = this.select.value;
        if (current === state) return;

        this.select.value = state;
    }

    getSelectedCode(): 'en' | 'sv' {
        return this.select.value as 'en' | 'sv';
    }

    getSelector(): HTMLSelectElement {
        return this.select;
    }
}
