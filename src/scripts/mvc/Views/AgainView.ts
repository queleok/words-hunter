export class AgainView {
    button: HTMLElement;

    constructor(selector: string) {
        this.button = document.getElementById(selector) as HTMLElement;
    }
}
