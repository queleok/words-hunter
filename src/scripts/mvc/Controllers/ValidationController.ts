import { FetchResult, PromiseQueue } from '../../queue.js';
import { ValidatorService } from '../Services/ValidatorService.js';

export class ValidationController {
    private queue: PromiseQueue;
    private validator: ValidatorService;
    private timeScale: number;

    constructor(validator: ValidatorService, timeScale = 1) {
        this.validator = validator;
        this.timeScale = timeScale;
        this.queue = new PromiseQueue(validator as any, timeScale);
    }

    async enqueue(word: string): Promise<FetchResult> {
        return this.queue.enqueue(word);
    }

    deplete(callback?: () => void): void {
        if (this.queue) {
            this.queue.deplete(() => {
                callback?.();
            });
        }
    }
}
