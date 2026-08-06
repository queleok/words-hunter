import { formatTime } from '../../format.js';

export class TimerView {
    private display: HTMLElement;
    private timerId?: ReturnType<typeof setInterval>;
    private secondsLeft: number;
    private onFinished?: () => void;

    constructor(displayElement: HTMLElement) {
        this.display = displayElement;
        this.secondsLeft = 0;
    }

    start(seconds: number, speedup: number): void {
        if (this.timerId) clearInterval(this.timerId);
        this.secondsLeft = seconds;
        this.updateDisplay();

        this.timerId = setInterval(() => {
            if (this.secondsLeft <= 0) {
                this.stop();
                this.onFinished?.();
                return;
            }
            --this.secondsLeft;
            this.updateDisplay();
        }, 1000 * speedup);
    }

    stop(): void {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = undefined;
        }
    }

    reset(seconds: number): void {
        this.stop();
        this.secondsLeft = seconds;
        this.updateDisplay();
    }

    private updateDisplay(): void {
        this.display.textContent = formatTime(this.secondsLeft);
    }
}
