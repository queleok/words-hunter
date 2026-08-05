import { escapeRegExp } from './format.js';
import { getLetterOrdinalNumber } from './generate-letters.js';
class WordSynchronizer {
    constructor(publisher, config, letters) {
        this.release = () => {
            // hide input & disable event listening for it
            this.input.value = '';
            this.input.parentElement.setAttribute("class", "hidden");
            this.input.removeEventListener('keypress', this.handleWord);
            this.input.removeEventListener('beforeinput', this.handleBeforeInput);
            this.input.removeEventListener('input', this.handleInput);
            for (const letter_widgets of this.letter_widgets) {
                if (!letter_widgets)
                    continue;
                for (const letter_widget of letter_widgets) {
                    letter_widget.release();
                }
            }
            if (this.publish)
                this.publish.removeEventListener('click', this.handlePublish);
            window.removeEventListener('keypress', this.handleWord);
        };
        this.setLetters = (letters) => {
            const letters_div = document.getElementById('letters');
            letters_div.textContent = "";
            this.letter_widgets = Array(this.config.alphabet.length);
            for (const letter of letters) {
                const widget = new LetterWidget(letter, letters_div, this);
                const ix = getLetterOrdinalNumber(letter, this.config.code);
                if (!this.letter_widgets[ix])
                    this.letter_widgets[ix] = new Array();
                this.letter_widgets[ix].push(widget);
            }
        };
        this.pop = (lw) => {
            const index = this.word.findIndex(ph => ph.widget === lw);
            if (index > -1) {
                this.word.splice(index, 1);
                this.input.value = this.input.value.slice(0, index) + this.input.value.slice(index + 1);
                this.evaluateRehighlighting(lw);
                return true;
            }
            return false;
        };
        this.push = (lw) => {
            if (this.word.length >= 16)
                return false;
            this.word.push({ widget: lw, letter: lw.getLetter() });
            this.input.value += lw.getLetter();
            return true;
        };
        this.evaluateRehighlighting = (lw) => {
            if (!this.overdraft)
                return;
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
        };
        this.highlightLetter = (letter) => {
            this.word.splice(this.cursor++, 0, { letter: letter });
            if (!this.config.alphabet.includes(letter.toLowerCase()))
                return;
            const widgets = this.letter_widgets[getLetterOrdinalNumber(letter, this.config.code)];
            if (widgets) {
                for (const letter_widget of widgets) {
                    if (letter == letter_widget.getLetter() && letter_widget.highlight()) {
                        this.word[this.cursor - 1].widget = letter_widget;
                        return;
                    }
                }
            }
            if (!this.overdraft)
                this.overdraft = Array(this.config.alphabet.length).fill(0); // Use dynamic length here
            this.overdraft[getLetterOrdinalNumber(letter, this.config.code)]++;
        };
        this.dehighlightLetters = () => {
            for (const letter_widgets of this.letter_widgets) {
                if (!letter_widgets)
                    continue;
                for (const letter of letter_widgets) {
                    letter.dehighlight();
                }
            }
            this.word.splice(0, this.word.length);
            this.cursor = 0;
            delete this.overdraft;
        };
        this.redoLettersHighlighting = () => {
            this.dehighlightLetters();
            for (const symbol of this.input.value.toLowerCase()) {
                this.highlightLetter(symbol);
            }
        };
        this.publishWord = () => {
            const word_unescaped = new String(this.input.value);
            if (this.input.checkValidity() && word_unescaped.length > 2) {
                this.input.value = '';
                this.dehighlightLetters();
                const word = escapeRegExp(word_unescaped.toLowerCase());
                this.publisher(word);
            }
        };
        this.handlePublish = (e) => {
            this.publishWord();
            e.stopPropagation();
        };
        this.handleWord = (e) => {
            switch (e.key) {
                case "Enter":
                    this.publishWord();
                    break;
            }
            e.stopPropagation();
        };
        this.handleInput = (e) => {
            const ie = e;
            if (ie.inputType === 'insertText' && ie.data !== null) {
                for (const alpha of ie.data.toLowerCase())
                    this.highlightLetter(alpha);
            }
            else if (ie.inputType !== "deleteContentBackward" && ie.inputType !== "deleteContentForward") {
                this.redoLettersHighlighting();
            }
        };
        this.handleBeforeInput = (e) => {
            const begin = this.input.selectionStart;
            const end = this.input.selectionEnd;
            this.cursor = begin;
            let splice_start = 0;
            let splice_length = 0;
            const inputType = e.inputType;
            if (inputType.startsWith("insert")) {
                if (begin !== end) {
                    splice_start = begin;
                    splice_length = end - begin;
                }
            }
            else if (inputType.startsWith("delete")) {
                if (begin !== end) {
                    splice_start = begin;
                    splice_length = end - begin;
                }
                else if (inputType === "deleteContentBackward" && begin > 0) {
                    splice_start = begin - 1;
                    splice_length = 1;
                }
                else if (inputType === "deleteContentForward" && begin < this.input.value.length) {
                    splice_start = begin;
                    splice_length = 1;
                }
            }
            if (splice_length > 0) {
                const removed = this.word.splice(splice_start, splice_length);
                for (const placeholder of removed) {
                    if (!placeholder.widget)
                        continue;
                    placeholder.widget.dehighlight();
                    this.evaluateRehighlighting(placeholder.widget);
                }
            }
        };
        this.cursor = 0;
        this.config = config;
        this.letter_widgets = Array(this.config.alphabet.length);
        const wordElement = document.getElementById('word');
        this.word = new Array();
        this.publisher = publisher;
        // Initialize input element and event listeners
        this.input = document.createElement('input');
        for (const elem of wordElement.children) {
            if (elem.tagName.toLowerCase() === "input")
                this.input = elem;
            else if (elem.tagName.toLowerCase() === "div" && elem.classList.contains("button")) {
                this.publish = elem;
                this.publish.addEventListener('click', this.handlePublish);
            }
        }
        // Create letter widgets based on the generated letters array
        this.setLetters(letters);
        this.input.parentElement.setAttribute("class", "hbox-nowrap");
        this.input.addEventListener('keypress', this.handleWord);
        this.input.addEventListener('beforeinput', this.handleBeforeInput);
        this.input.addEventListener('input', this.handleInput);
        this.input.pattern = `[${this.config.alphabet}${this.config.alphabet.toUpperCase()}]{3,16}`;
        window.addEventListener('keypress', this.handleWord);
    }
}
class LetterWidget {
    constructor(letter, parent, synchronizer) {
        this.release = () => {
            this.container.removeEventListener('click', this.toggleHighlighting);
            this.dehighlight();
        };
        this.toggleHighlighting = (e) => {
            if (this.dehighlight()) {
                this.sync.pop(this);
            }
            else if (this.sync.push(this)) {
                this.highlight();
            }
            e.stopPropagation();
        };
        this.highlight = () => {
            if (this.highlighted)
                return false;
            this.container.classList.add('highlighted');
            this.highlighted = true;
            return true;
        };
        this.dehighlight = () => {
            if (!this.highlighted)
                return false;
            this.container.classList.remove('highlighted');
            this.highlighted = false;
            return true;
        };
        this.getLetter = () => { return this.letter; };
        this.sync = synchronizer;
        this.letter = letter;
        this.container = document.createElement('div');
        this.container.setAttribute('class', 'hbox-nowrap cell l-' + letter);
        this.container.textContent = letter;
        this.highlighted = false;
        this.container.addEventListener('click', this.toggleHighlighting);
        parent.append(this.container);
    }
}
;
export { LetterWidget, WordSynchronizer };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc2NyaXB0cy91aS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQzNDLE9BQU8sRUFBa0Isc0JBQXNCLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQU8vRSxNQUFNLGdCQUFnQjtJQVVsQixZQUFZLFNBQWlDLEVBQUUsTUFBc0IsRUFBRSxPQUFpQjtRQWtDeEYsWUFBTyxHQUFHLEdBQUcsRUFBRTtZQUNYLDhDQUE4QztZQUM5QyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFjLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUUxRCxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDNUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRTFELEtBQUssTUFBTSxjQUFjLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLENBQUMsY0FBYztvQkFBRSxTQUFTO2dCQUM5QixLQUFLLE1BQU0sYUFBYSxJQUFJLGNBQWMsRUFBRSxDQUFDO29CQUN6QyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzVCLENBQUM7WUFDTCxDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsT0FBTztnQkFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7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