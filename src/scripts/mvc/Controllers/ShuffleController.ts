import { shuffle } from '../../generate-letters.js';

export class ShuffleController {
    private lettersContainer: HTMLElement;

    constructor(containerElementId: string) {
        this.lettersContainer = document.getElementById(containerElementId)!;
    }

    shuffle(): void {
        const children = Array.from(this.lettersContainer.children);
        const indices = [...Array(children.length).keys()];
        shuffle(indices);

        let sortedChildren: Node[] = [];
        for (const idx of indices) {
            sortedChildren.push(children[idx]);
        }

        for (const child of sortedChildren) {
            this.lettersContainer.appendChild(child);
        }
    }
}
