import { TimerView } from '../Views/TimerView.js';

export class TimerController {
    private timerView: TimerView;
    private speedup: number;

    constructor(timerDisplayElement?: HTMLElement, speedup = 1) {
        if (timerDisplayElement) {
            this.timerView = new TimerView(timerDisplayElement);
        } else {
            this.timerView = null as any;
        }
        this.speedup = speedup;
    }

    start(seconds: number): void {
        if (this.timerView) {
            this.timerView.start(seconds, this.speedup);
        }
    }

    stop(): void {
        if (this.timerView) {
            this.timerView.stop();
        }
    }

    reset(seconds: number): void {
        if (this.timerView) {
            this.timerView.reset(seconds);
        }
    }
}
