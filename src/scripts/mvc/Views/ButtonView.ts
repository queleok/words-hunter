export class ButtonView {
    button: HTMLElement;

    constructor(selector: string) {
        this.button = document.getElementById(selector) as HTMLElement;
    }
}
