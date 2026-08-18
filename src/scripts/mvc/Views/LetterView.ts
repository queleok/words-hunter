export class LetterView {
    private container: HTMLElement;

    constructor(selector: string) {
        this.container = document.getElementById(selector) as HTMLElement;
    }

    render(letters: string, onCellClick?: (event: MouseEvent) => void): void {
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        letters.split('').forEach((letter, index) => {
            const cell = document.createElement('div');
            cell.classList.add('cell', 'hbox-nowrap');
            cell.textContent = letter;
            cell.dataset.letterIndex = String(index);
            this.container.appendChild(cell);

            if (onCellClick) cell.addEventListener('click', onCellClick);
        });
    }

    toggleCell(index: number): 'active' | 'passive' {
        const cell = this.container.children[index] as HTMLElement;
        if (!cell) return 'passive';
        const isActive = cell.classList.contains('highlighted');
        if (isActive) {
            cell.classList.remove('highlighted');
            return 'passive';
        } else {
            cell.classList.add('highlighted');
            return 'active';
        }
    }

    activateCell(index: number): void {
        const cell = this.container.children[index] as HTMLElement;
        if (cell) cell.classList.add('highlighted');
    }

    deactivateCell(index: number): void {
        const cell = this.container.children[index] as HTMLElement;
        if (cell) cell.classList.remove('highlighted');
    }

    getPassiveCellIndex(letter: string): number | undefined {
        for (let i = 0; i < this.container.children.length; i++) {
            const cell = this.container.children[i] as HTMLElement;
            if ((cell.textContent || '').trim() === letter && !cell.classList.contains('highlighted')) {
                return i;
            }
        }
        return undefined;
    }
}
