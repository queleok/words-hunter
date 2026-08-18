import { formatTime } from '../../format.js';

export class TimerView {
    private display: HTMLElement;

    constructor(selector: string) {
        this.display = document.getElementById(selector) as HTMLElement;
    }

    render(seconds: number): void {
        this.display.textContent = formatTime(seconds);
    }
}
