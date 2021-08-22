import { escapeRegExp } from './format.js';
import { getLetterOrdinalNumber } from './generate-letters.js';

type WidgetPlaceholder = {
    widget?: LetterWidget;
    letter: string;
}

class WordSynchronizer {
    private input: HTMLInputElement;
    private letter_widgets: Array<Array<LetterWidget>>;
    private word: Array<WidgetPlaceholder>;
    private publisher: (word: string) => void;
    private publish?: HTMLElement;
    private cursor: number;
    private overdraft?: Array<number>;

    constructor(word: HTMLElement, publisher: (word: string) => void) {
        this.cursor = 0;

        this.letter_widgets = Array<Array<LetterWidget>>(26);

        this.word = new Array<WidgetPlaceholder>();
        this.publisher = publisher;

        this.input = document.createElement('input');

        for (const elem of word.children) {
            if (elem.tagName.toLowerCase() === "input") this.input = elem as HTMLInputElement;
            else if (elem.tagName.toLowerCase() === "div" && elem.classList.contains("button")) {
                this.publish = elem as HTMLElement;
                this.publish.addEventListener('click', this.handlePublish);
            }
        }

        this.input.parentElement!.setAttribute("class", "hbox-nowrap");
        this.input.addEventListener('keypress', this.handleWord);
        this.input.addEventListener('beforeinput', this.handleBeforeInput);
        this.input.addEventListener('input', this.handleInput);

        window.addEventListener('keypress', this.handleWord);
    }

    release = () => {
        // hide input & disable event listening for it
        this.input.value = '';
        this.input.parentElement!.setAttribute("class", "hidden");

        this.input.removeEventListener('keypress', this.handleWord);
        this.input.removeEventListener('beforeinput', this.handleBeforeInput);
        this.input.removeEventListener('input', this.handleInput);

        for (const letter_widgets of this.letter_widgets) {
            if (!letter_widgets) continue;
            for (const letter_widget of letter_widgets) {
                letter_widget.release();
            }
        }

        if (this.publish) this.publish.removeEventListener('click', this.handlePublish);

        window.removeEventListener('keypress', this.handleWord);
    }

    setLetters = (letts: Array<LetterWidget>) => {
        this.letter_widgets = Array<Array<LetterWidget>>(26);
        for (const lw of letts) {
            const ix = getLetterOrdinalNumber(lw.getLetter());
            if (!this.letter_widgets[ix]) this.letter_widgets[ix] = new Array<LetterWidget>();
            this.letter_widgets[ix].push(lw);
        }
    }

    pop = (lw: LetterWidget) => {
        const index = this.word.findIndex(ph => ph.widget === lw);
        if (index > -1) {
            this.word.splice(index, 1);
            this.input.value = this.input.value.slice(0, index) + this.input.value.slice(index + 1);
            this.evaluateRehighlighting(lw);
        }
    }

    push = (lw: LetterWidget) => {
        this.word.push({ widget: lw, letter: lw.getLetter() });
        this.input.value += lw.getLetter();
    }

    private evaluateRehighlighting = (lw: LetterWidget) => {
        if (!this.overdraft) return;

        let credit = this.overdraft[getLetterOrdinalNumber(lw.getLetter())];
        if (credit > 0) {
            for (const ph of this.word) {
                if (ph.letter == lw.getLetter() && !ph.widget) {
                    ph.widget = lw;
                    ph.widget.highlight();
                    --credit;
                    break;
                }
            }
        }
    }

    private highlightLetter = (letter: string) => {
        this.word.splice(this.cursor++, 0, { letter: letter });
        if (letter.match(/^[^a-z0-9]+$/i) !== null) return;

        const widgets = this.letter_widgets[getLetterOrdinalNumber(letter)];
        if (widgets) {
            for (const letter_widget of widgets) {
                if (letter == letter_widget.getLetter() && letter_widget.highlight()) {
                    this.word[this.cursor - 1].widget = letter_widget;
                    return;
                }
            }
        }

        if (!this.overdraft) this.overdraft = Array(26).fill(0);
        this.overdraft[getLetterOrdinalNumber(letter)]++;
    }

    private dehighlightLetters = () => {
        for (const letter_widgets of this.letter_widgets) {
            if (!letter_widgets) continue;
            for (const letter of letter_widgets) {
                letter.dehighlight();
            }
        }
        this.word.splice(0, this.word.length);
        this.cursor = 0;
        delete this.overdraft;
    }
    
    private redoLettersHighlighting = () => {
        this.dehighlightLetters();
        for (const symbol of this.input.value.toLowerCase()) {
            this.highlightLetter(symbol);
        }
    }

    private publishWord = () => {
        const word_unescaped = new String(this.input.value);
        if (this.input.checkValidity() && word_unescaped.length > 2) {
            this.input.value = '';
            this.dehighlightLetters();
            const word = escapeRegExp(word_unescaped.toLowerCase());
            this.publisher(word);
        }
    }

    private handlePublish = (e: Event) => {
        this.publishWord();
        e.stopPropagation();
    }

    private handleWord = (e: KeyboardEvent) => {
        switch(e.key) {
            case "Enter":
                this.publishWord();
                break;
        }
        e.stopPropagation();
    }

    private handleInput = (e: Event) => {
        const ie = e as InputEvent;
        if (ie.inputType === 'insertText' && ie.data !== null) {
            for (const alpha of ie.data.toLowerCase()) this.highlightLetter(alpha);
        } else if (ie.inputType !== "deleteContentBackward" && ie.inputType !== "deleteContentForward") {
            this.redoLettersHighlighting();
        }
    }
    
    private handleBeforeInput = (e: InputEvent) => {
        const begin = this.input.selectionStart!;
        const end = this.input.selectionEnd!;

        this.cursor = begin;

        let splice_start = 0;
        let splice_length = 0;

        const inputType = e.inputType;
        if (inputType.startsWith("insert")) {
            if (begin !== end) {
                splice_start = begin;
                splice_length = end - begin;
            }
        } else if (inputType.startsWith("delete")) {
            if (begin !== end) {
                splice_start = begin;
                splice_length = end - begin;
            } else if (inputType === "deleteContentBackward" && begin > 0) {
                splice_start = begin - 1;
                splice_length = 1;
            } else if (inputType === "deleteContentForward" && begin < this.input.value.length) {
                splice_start = begin;
                splice_length = 1;
            }
        }

        if (splice_length > 0) {
            const removed = this.word.splice(splice_start, splice_length);
            for (const placeholder of removed) {
                if (!placeholder.widget) continue;
                placeholder.widget.dehighlight();
                this.evaluateRehighlighting(placeholder.widget);
            }
        }
    }

}

class LetterWidget {
    private container: HTMLElement;
    private letter: string;
    private highlighted: boolean;
    private sync: WordSynchronizer;

    constructor(letter: string, parent: Element, synchronizer: WordSynchronizer) {
        this.sync = synchronizer;

        this.letter = letter;

        this.container = document.createElement('div');
        this.container.setAttribute('class', 'hbox-nowrap cell l-' + letter);
        this.container.textContent = letter;

        this.highlighted = false;
        this.container.addEventListener('click', this.toggleHighlighting);

        parent.append(this.container);

    }

    release = () => {
        this.container.removeEventListener('click', this.toggleHighlighting);
        this.dehighlight();
    }

    private toggleHighlighting = (e: Event) => {
        if (this.highlighted) {
            this.dehighlight();
            this.sync.pop(this);
        } else {
            this.highlight();
            this.sync.push(this);
        }

        e.stopPropagation();
    }

    highlight = () => {
        if (this.highlighted) return false;
        this.container.classList.add('highlighted');
        this.highlighted = true;
        return true;
    }

    dehighlight = () => {
        if (!this.highlighted) return false;
        this.container.classList.remove('highlighted');
        this.highlighted = false;
        return true;
    }

    getLetter = () => { return this.letter; }
};

export { LetterWidget, WordSynchronizer };
