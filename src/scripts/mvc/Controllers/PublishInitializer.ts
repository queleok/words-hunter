import { PublishController } from './PublishController.js';

export class PublishInitializer {
    private publishController: PublishController;

    constructor() {
        this.publishController = new PublishController('scores');
    }

    initialize(): void {
        const publishButton = document.getElementById('publish') as HTMLElement;
        if (publishButton) {
            publishButton.addEventListener('click', () => {
                this.publishWord();
            });
        }
    }

    private publishWord(): void {
        const input = document.getElementById('inpt') as HTMLInputElement;
        if (!input) return;

        const word = input.value.trim().toLowerCase();
        if (word.length < 3 || !input.checkValidity()) return;

        input.value = '';
    }
}
