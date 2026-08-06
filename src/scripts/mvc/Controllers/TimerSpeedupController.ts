declare global {
    interface Window { _puppeteerGetSpeedup: () => Promise<number>; }
}

export class TimerSpeedupController {
    private speedup: number;

    constructor() {
        this.speedup = 1.0;
    }

    getSpeedup(): number {
        return this.speedup;
    }
}
