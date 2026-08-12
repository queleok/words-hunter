import { ButtonView } from '../Views/ButtonView.js';

export class ButtonController {
    private id: string;
    private view: ButtonView;
    private onClick?: () => void;

    constructor(id: string) {
        this.id = id;
        this.view = new ButtonView(id);
        this.view.button.addEventListener('click', this.handleClick.bind(this));
    }

    setOnClick(callback?: () => void): void {
        this.onClick = callback;
    }

    handleClick(): void {
        if (this.onClick) {
            this.onClick();
        } else {
            console.log(`${this.id} triggered`);
        }
    }
}
