class WordSynchronizer {
    private input: HTMLInputElement;
    word: Array<LetterWidget>;

    constructor(word_input: HTMLInputElement) {
        this.input = word_input;
        this.word = new Array<LetterWidget>();
    }

    pop = (letter: LetterWidget) => {
        const index = this.word.indexOf(letter);
        if (index > -1) {
            this.word.splice(index, 1);
            this.input.value = this.word.reduce((w, lw) => w + lw.getLetter(), '');
        }
    }

    push = (letter: LetterWidget) => {
        this.word.push(letter);
        this.input.value += letter.getLetter();
    }
}

class LetterWidget {
    private container: HTMLElement;
    private input: HTMLInputElement;
    private letter: string;
    private highlighted: boolean;
    private sync: WordSynchronizer;

    constructor(letter: string, parent: Element, word_input: HTMLInputElement, synchronizer: WordSynchronizer) {
        this.input = word_input;
        this.sync = synchronizer;

        this.letter = letter;
        console.log(`create letter ${this.letter}`);

        this.container = document.createElement('div');
        this.container.setAttribute('class', 'hbox-nowrap cell l-' + letter);
        this.container.textContent = letter;

        this.highlighted = false;
        this.container.addEventListener('click', this.toggleHighlighting);

        parent.append(this.container);

        this.input.addEventListener('keypress', this.keyPressed);
    }

    release = () => {
        this.container.removeEventListener('click', this.toggleHighlighting);
        this.input.removeEventListener('keypress', this.keyPressed);
        console.log(`destroy letter ${this.letter}`);
    }

    toggleHighlighting = (e: Event) => {
        const cls = 'highlighted';

        if (this.highlighted) {
            this.container.classList.remove(cls);
            this.sync.pop(this);
        } else {
            this.container.classList.add(cls);
            this.sync.push(this);
        }

        this.highlighted = !this.highlighted;

        e.stopPropagation();
    }

    highlight = () => {
        if (this.highlighted) return false;
        this.container.classList.add('highlighted');
        this.sync.word.push(this);
        this.highlighted = true;
        return true;
    }

    dehighlight = () => {
        if (!this.highlighted) return false;
        this.container.classList.remove('highlighted');
        this.highlighted = false;
        const index = this.sync.word.indexOf(this);
        if (index > -1) this.sync.word.splice(index, 1);
        return true;
    }

    keyPressed = (e: KeyboardEvent) => {
        switch (e.key) {
            case this.letter.toUpperCase():
            case this.letter:
                if (this.highlighted) break;
                this.highlight();
                e.stopPropagation();
                e.stopImmediatePropagation();
                break;
        }
    }

    getLetter = () => { return this.letter; }
};

export { LetterWidget, WordSynchronizer };
