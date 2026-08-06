import { ShuffleController } from './ShuffleController.js';

export class ShuffleInitializer {
    private shuffleController: ShuffleController;

    constructor() {
        this.shuffleController = new ShuffleController('letters');
    }

    initialize(): void {
        const shuffler = () => {
            this.shuffleController.shuffle();
        };

        const shuffleBtn = document.getElementById('shuffle') as HTMLElement;
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', shuffler);
        }
    }
}
