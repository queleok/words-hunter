import { AgainController } from './AgainController.js';

export class AgainInitializer {
    private againController: AgainController;

    constructor() {
        this.againController = new AgainController('again');
    }

    initialize(onAgain?: () => void): void {
        this.againController.setOnAgain(() => {
            if (onAgain) onAgain();
            else console.log('Play again triggered');
        });
    }
}
