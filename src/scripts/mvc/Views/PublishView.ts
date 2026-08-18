export class PublishView {
    private button: HTMLElement;

    constructor(id: string) {
        this.button = document.getElementById(id) as HTMLElement;
    }

    getButton(): HTMLElement {
        return this.button;
    }
}
