import { LettersState, generateLetters } from '../Models/LetterData.js';
import { LetterView } from '../Views/LetterView.js';
import { LanguageCode } from '../Models/LanguageState.js';
import { getLetterOrdinalNumber } from '../../generate-letters.js';

export class LetterController {
    private view: LetterView = new LetterView('letters');
    private state: LettersState = generateLetters('en');
    private append?: (letter: string) => boolean;
    private remove?: (index: number) => boolean;

    reset(lang: LanguageCode): void {
        this.state = generateLetters(lang);
        this.view.render(this.state.letters, this.handleCellClicked.bind(this));
    }

    setAppend(callback?: (letter: string) => boolean) {
        this.append = callback;
    }

    setRemove(callback?: (index: number) => boolean) {
        this.remove = callback;
    }

    private handleCellClicked(event: MouseEvent): void {
        if (!this.append || !this.remove) return;

        const cell = event.target as HTMLElement;
        const letter = cell.textContent || '';

        const cellIndex = Number(cell.dataset.letterIndex);
        if (Number.isNaN(cellIndex)) return;

        const newState = this.view.toggleCell(cellIndex);
        if (newState === 'active') {
            let appended = true;
            if (this.append) appended = this.append(letter);

            // NOTE: append failed, revert activation
            if (!appended) {
                this.view.toggleCell(cellIndex);
                return;
            }

            this.state.buffer.push({ letterCode: letter.charCodeAt(0), cellIndex: cellIndex });

            --this.state.pool[getLetterOrdinalNumber(letter, this.state.config.code)];
        } else if (newState === 'passive') {
            const bufferIndex = this.state.buffer.findIndex((item) => item.letterCode === letter.charCodeAt(0) && item.cellIndex === cellIndex);

            if (this.remove) this.remove(bufferIndex);

            this.state.buffer.splice(bufferIndex, 1);

            // NOTE: overdraft handling, re-highlighting the cell again
            if (++this.state.pool[getLetterOrdinalNumber(letter, this.state.config.code)] <= 0) {
                this.view.toggleCell(cellIndex);
                const newBufferIndex = this.state.buffer.findIndex((item) => item.letterCode === letter.charCodeAt(0) && item.cellIndex === undefined);
                this.state.buffer[newBufferIndex].cellIndex = cellIndex;
            }
        }
    }

    activate(letter: string, bufferIndex: number): void {
        const cellIndex = this.view.getPassiveCellIndex(letter);

        this.state.buffer.splice(bufferIndex, 0, { letterCode: letter.charCodeAt(0), cellIndex: cellIndex });

        if (cellIndex !== undefined) this.view.toggleCell(cellIndex);

        --this.state.pool[getLetterOrdinalNumber(letter, this.state.config.code)];
    }

    deactivate(letter: string, bufferIndex: number): void {
        const spliced = this.state.buffer.splice(bufferIndex, 1)[0];
        const cellIndex = spliced.cellIndex;


        const letterIndex = getLetterOrdinalNumber(letter, this.state.config.code);
        ++this.state.pool[letterIndex];

        if (cellIndex === undefined) return;

        if (this.state.pool[letterIndex] > 0) this.view.toggleCell(cellIndex);
        else {
            const newBufferIndex = this.state.buffer.findIndex((item) => item.letterCode === spliced.letterCode && item.cellIndex === undefined);
            this.state.buffer.splice(newBufferIndex, 1, spliced);
        }
    }

    deactivateAll(): void {
        this.state.buffer
            .forEach((item) => {
                const index = item.cellIndex;
                if (index === undefined) return;

                this.view.toggleCell(index);

                const letter = this.state.letters[index];
                const letterIndex = getLetterOrdinalNumber(letter, this.state.config.code);

                if (this.state.pool[letterIndex] < 0) this.state.pool[letterIndex] = 1;
                else ++this.state.pool[letterIndex];
            });

        this.state.buffer = [];
    }
}
