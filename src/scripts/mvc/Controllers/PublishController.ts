import { PublishView } from '../Views/PublishView.js';
import { InputController } from './InputController.js';

export class PublishController {
    private view: PublishView = new PublishView('publish');
    private onClick?: () => void;

    constructor() {
        this.view.getButton().addEventListener('click', this.click.bind(this));
    }

    setOnClick(callback: () => void): void {
        this.onClick = callback;
    }

    click() {
        if (this.onClick) {
            this.onClick();
        }
    }
}
