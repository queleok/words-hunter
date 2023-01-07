import { escapeRegExp } from './format.js';
import { getLetterOrdinalNumber } from './generate-letters.js';
class WordSynchronizer {
    constructor(word, publisher) {
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
        this.setLetters = (letts) => {
            this.letter_widgets = Array(26);
            for (const lw of letts) {
                const ix = getLetterOrdinalNumber(lw.getLetter());
                if (!this.letter_widgets[ix])
                    this.letter_widgets[ix] = new Array();
                this.letter_widgets[ix].push(lw);
            }
        };
        this.pop = (lw) => {
            const index = this.word.findIndex(ph => ph.widget === lw);
            if (index > -1) {
                this.word.splice(index, 1);
                this.input.value = this.input.value.slice(0, index) + this.input.value.slice(index + 1);
                this.evaluateRehighlighting(lw);
            }
        };
        this.push = (lw) => {
            this.word.push({ widget: lw, letter: lw.getLetter() });
            this.input.value += lw.getLetter();
        };
        this.evaluateRehighlighting = (lw) => {
            if (!this.overdraft)
                return;
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
        };
        this.highlightLetter = (letter) => {
            this.word.splice(this.cursor++, 0, { letter: letter });
            if (letter.match(/^[^a-z0-9]+$/i) !== null)
                return;
            const widgets = this.letter_widgets[getLetterOrdinalNumber(letter)];
            if (widgets) {
                for (const letter_widget of widgets) {
                    if (letter == letter_widget.getLetter() && letter_widget.highlight()) {
                        this.word[this.cursor - 1].widget = letter_widget;
                        return;
                    }
                }
            }
            if (!this.overdraft)
                this.overdraft = Array(26).fill(0);
            this.overdraft[getLetterOrdinalNumber(letter)]++;
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
        this.letter_widgets = Array(26);
        this.word = new Array();
        this.publisher = publisher;
        this.input = document.createElement('input');
        for (const elem of word.children) {
            if (elem.tagName.toLowerCase() === "input")
                this.input = elem;
            else if (elem.tagName.toLowerCase() === "div" && elem.classList.contains("button")) {
                this.publish = elem;
                this.publish.addEventListener('click', this.handlePublish);
            }
        }
        this.input.parentElement.setAttribute("class", "hbox-nowrap");
        this.input.addEventListener('keypress', this.handleWord);
        this.input.addEventListener('beforeinput', this.handleBeforeInput);
        this.input.addEventListener('input', this.handleInput);
        window.addEventListener('keypress', this.handleWord);
    }
}
class LetterWidget {
    constructor(letter, parent, synchronizer) {
        this.release = () => {
            this.container.removeEventListener('click', this.toggleHighlighting);
            this.dehighlight();
            console.log(`destroy letter ${this.letter}`);
        };
        this.toggleHighlighting = (e) => {
            if (this.highlighted) {
                this.dehighlight();
                this.sync.pop(this);
            }
            else {
                this.highlight();
                this.sync.push(this);
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
        console.log(`create letter ${this.letter}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc2NyaXB0cy91aS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQzNDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBTy9ELE1BQU0sZ0JBQWdCO0lBU2xCLFlBQVksSUFBaUIsRUFBRSxTQUFpQztRQTBCaEUsWUFBTyxHQUFHLEdBQUcsRUFBRTtZQUNYLDhDQUE4QztZQUM5QyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFjLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUUxRCxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDNUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRTFELEtBQUssTUFBTSxjQUFjLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtnQkFDOUMsSUFBSSxDQUFDLGNBQWM7b0JBQUUsU0FBUztnQkFDOUIsS0FBSyxNQUFNLGFBQWEsSUFBSSxjQUFjLEVBQUU7b0JBQ3hDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztpQkFDM0I7YUFDSjtZQUVELElBQUksSUFBSSxDQUFDLE9BQU87Z0JBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRWhGLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxVQUFV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