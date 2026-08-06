import { ResultsController } from './ResultsController.js';

export class ResultsInitializer {
    private resultsController: ResultsController;

    constructor() {
        this.resultsController = new ResultsController('result');
    }

    initialize(): void {
        const disclaimer = document.getElementById('network-issues-disclaimer') as HTMLElement;
        if (disclaimer) {
            disclaimer.classList.add('hidden');
        }

        this.resultsController.showPending();
    }
}
