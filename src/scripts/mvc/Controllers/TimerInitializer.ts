import { TimerController } from './TimerController.js';

export class TimerInitializer {
    private timerController: TimerController;

    constructor() {
        this.timerController = new TimerController();
    }

    initialize(seconds: number): void {
        const speedup = 1.0;
        this.timerController.start(seconds * speedup);
    }

    stop(): void {
        this.timerController.stop();
    }
}
