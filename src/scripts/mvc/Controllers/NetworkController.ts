import { PublishController } from './PublishController.js';

export class NetworkController {
    private publishController: PublishController;
    private resendButton: HTMLElement;

    constructor() {
        this.publishController = new PublishController('scores');
        this.resendButton = document.getElementById('resend')!;
    }

    handleResend(): void {
        const failedWords = document.querySelectorAll('.network-failure');
        for (const word of failedWords) {
            word.classList.remove('network-failure');
            word.classList.add('pending-score');
        }

        this.publishController.hideDisclaimer();
    }
}
