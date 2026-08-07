import { TimerView } from '../Views/TimerView.js';

export class TimerController {
    private view: TimerView = new TimerView('timeleft');
    private timer?: ReturnType<typeof setInterval>;
    private onEnd?: () => void;
    private count: number = 0;

    start(seconds: number): void {
        this.stop();

        this.count = seconds;
        this.view.render(this.count);
        this.timer = setInterval(this.decay.bind(this), 1000);
    }

    private decay(): void {
        --this.count;
        this.view.render(this.count);

        if (this.count <= 0) {
            this.stop();
            if (this.onEnd) {
                this.onEnd();
            }
        }
    }

    private stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    setOnEnd(callback: () => void): void {
        this.onEnd = callback;
    }
}
