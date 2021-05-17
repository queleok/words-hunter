class LetterWidget {
    private container: HTMLElement;
    // private input: HTMLInputElement;
    private letter: string;
    private highlighted: boolean;

    constructor(letter: string, parent: Element) {
        this.letter = letter;
        console.log(`create letter ${this.letter}`);

        this.container = document.createElement('div');
        this.container.setAttribute('class', 'hbox-nowrap cell l-' + letter);
        this.container.textContent = letter;

        this.highlighted = false;
        this.container.addEventListener('click', this.toggleHighlighting);

        parent.append(this.container);
    }

    release = () => {
        this.container.removeEventListener('click', this.toggleHighlighting);
        console.log(`destroy letter ${this.letter}`);
    }

    toggleHighlighting = (e: Event) => {
        const cls = 'highlighted';

        if (this.highlighted) this.container.classList.remove(cls);
        else                  this.container.classList.add(cls);

        this.highlighted = !this.highlighted;

        e.stopPropagation();
    }

    highlight = () => {
        if (this.highlighted) return;
        this.container.classList.add('highlighted');
        this.highlighted = true;
    }

    dehighlight = () => {
        if (!this.highlighted) return;
        this.container.classList.remove('highlighted');
        this.highlighted = false;
    }
};

export { LetterWidget };
