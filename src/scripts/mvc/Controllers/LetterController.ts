import { LettersState, generateLetters } from '../Models/LetterData.js';
import { LetterView } from '../Views/LetterView.js';
import { LanguageCode } from '../Models/LanguageState.js';

export class LetterController {
    private view: LetterView = new LetterView('letters');
    private state: LettersState = generateLetters('en');
    private append?: (letter: string) => boolean;
    private remove?: (index: number) => boolean;

    reset(lang: LanguageCode): void {
        this.state = generateLetters(lang);
        this.view.render(this.state.letters, this.handleCellClicked.bind(this));
    }

    setAppend(callback: (letter: string) => boolean) {
        this.append = callback;
    }

    setRemove(callback: (index: number) => boolean) {
        this.remove = callback;
    }

    private handleCellClicked(event: MouseEvent): void {
        const cell = event.target as HTMLElement;

        const cellIndex = Number(cell.dataset.letterIndex);
        if (Number.isNaN(cellIndex)) return;

        const newState = this.view.toggleCell(cellIndex);
        if (newState === 'active') {
            let appended = true;
            if (this.append) appended = this.append(cell.textContent);

            // append failed, revert activation
            if (!appended) {
                this.view.toggleCell(cellIndex);
                return;
            }

            this.state.buffer.push(cellIndex);
            // NOTE: the overdraft is impossible in this case
        } else if (newState === 'passive') {
            const bufferIndex = this.state.buffer.indexOf(cellIndex);

            if (this.remove) this.remove(bufferIndex);

            this.state.buffer.splice(bufferIndex, 1);
            // TODO: handle overdraft case when in the input there were e.g. 3 'a', but in the cells there were only 2 'a', and the user tried deactivating 1 cell
        }
    }

    activate(letter: string, bufferIndex: number): void {
        const cellIndex = this.view.getPassiveCellIndex(letter);

        this.state.buffer.splice(bufferIndex, 0, cellIndex);

        if (cellIndex !== undefined) this.view.toggleCell(cellIndex);
        // TODO: handle overdraft
    }

    deactivate(bufferIndex: number): void {
        const cellIndex = this.state.buffer[bufferIndex];

        this.state.buffer.splice(bufferIndex, 1);

        if (cellIndex !== undefined) this.view.toggleCell(cellIndex);
        // TODO: handle overdraft
    }

    deactivateAll(): void {
        this.state.buffer
            .forEach((index) => { if (index !== undefined) this.view.toggleCell(index); });

        this.state.buffer = [];
    }
}
