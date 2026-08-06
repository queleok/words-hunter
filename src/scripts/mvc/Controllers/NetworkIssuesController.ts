import { ResultsController } from './ResultsController.js';

export class NetworkIssuesController {
    private resultsController: ResultsController;
    private resendButton: HTMLElement;

    constructor() {
        this.resultsController = new ResultsController('result');
        this.resendButton = document.getElementById('resend')!;
    }

    handleNetworkFailure(): void {
        const disclaimer = document.getElementById('network-issues-disclaimer');
        if (disclaimer) {
            disclaimer.classList.remove('hidden');
        }
    }

    handleResendClick(): void {
        this.resultsController.reportResults();
        this.handleNetworkFailure();
    }

    setupResendListener(): void {
        this.resendButton.addEventListener('click', () => {
            this.handleResendClick();
        }, { once: true });
    }
}
