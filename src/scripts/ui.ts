import { escapeRegExp } from './format.js';
import { LanguageConfig, getLetterOrdinalNumber } from './generate-letters.js';

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
    private config: LanguageConfig;

    constructor(publisher: (word: string) => void, config: LanguageConfig, letters: string[]) {
        this.cursor = 0;
        this.config = config;

        this.letter_widgets = Array<Array<LetterWidget>>(this.config.alphabet.length);

        const wordElement = document.getElementById('word')!;

        this.word = new Array<WidgetPlaceholder>();
        this.publisher = publisher;

        // Initialize input element and event listeners
        this.input = document.createElement('input');

        for (const elem of wordElement.children) {
            if (elem.tagName.toLowerCase() === "input") this.input = elem as HTMLInputElement;
            else if (elem.tagName.toLowerCase() === "div" && elem.classList.contains("button")) {
                this.publish = elem as HTMLElement;
                this.publish.addEventListener('click', this.handlePublish);
            }
        }

        // Create letter widgets based on the generated letters array
        this.setLetters(letters);

        this.input.parentElement!.setAttribute("class", "hbox-nowrap");
        this.input.addEventListener('keypress', this.handleWord);
        this.input.addEventListener('beforeinput', this.handleBeforeInput);
        this.input.addEventListener('input', this.handleInput);
        this.input.pattern = `[${this.config.alphabet}${this.config.alphabet.toUpperCase()}]{3,16}`;

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

    private setLetters = (letters: string[]) => {
        const letters_div = document.getElementById('letters') as HTMLElement;
        letters_div.textContent = "";

        this.letter_widgets = Array<Array<LetterWidget>>(this.config.alphabet.length);
        for (const letter of letters) {
            const widget = new LetterWidget(letter, letters_div, this);
            const ix = getLetterOrdinalNumber(letter, this.config.code);
            if (!this.letter_widgets[ix]) this.letter_widgets[ix] = new Array<LetterWidget>();
            this.letter_widgets[ix].push(widget);
        }
    }


    pop = (lw: LetterWidget) => {
        const index = this.word.findIndex(ph => ph.widget === lw);
        if (index > -1) {
            this.word.splice(index, 1);
            this.input.value = this.input.value.slice(0, index) + this.input.value.slice(index + 1);
            this.evaluateRehighlighting(lw);
            return true;
        }

        return false;
    }

    push = (lw: LetterWidget) => {
        if (this.word.length >= 16) return false;

        this.word.push({ widget: lw, letter: lw.getLetter() });
        this.input.value += lw.getLetter();
        return true;
    }

    private evaluateRehighlighting = (lw: LetterWidget) => {
        if (!this.overdraft) return;

        let credit = this.overdraft[getLetterOrdinalNumber(lw.getLetter(), this.config.code)];
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
        if (!this.config.alphabet.includes(letter.toLowerCase())) return;

        const widgets = this.letter_widgets[getLetterOrdinalNumber(letter, this.config.code)];
        if (widgets) {
            for (const letter_widget of widgets) {
                if (letter == letter_widget.getLetter() && letter_widget.highlight()) {
                    this.word[this.cursor - 1].widget = letter_widget;
                    return;
                }
            }
        }

        if (!this.overdraft) this.overdraft = Array(this.config.alphabet.length).fill(0); // Use dynamic length here
        this.overdraft[getLetterOrdinalNumber(letter, this.config.code)]++;
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
        if (this.dehighlight()) {
            this.sync.pop(this);
        } else if (this.sync.push(this)) {
            this.highlight();
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
