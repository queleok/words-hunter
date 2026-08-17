import { LanguageState } from '../Models/LanguageState.js';
import { ValidationResult } from '../Models/ValidationResult.js';
import { WiktionaryAPI } from './WiktionaryAPI.js';
import { ExternalAPI } from './ExternalAPI.js';

export class ValidationService {
    private externalAPI: ExternalAPI;
    private lastRequestTime: number = 0;
    private minIntervalMs: number = 500;
    private requestQueue: Promise<any> = Promise.resolve();
    private queueAbortController: AbortController = new AbortController();

    constructor() {
        this.externalAPI = new WiktionaryAPI('English');
    }

    public reset(lang: LanguageState): void {
        this.externalAPI = new WiktionaryAPI(lang.name);

        this.queueAbortController.abort();
        this.queueAbortController = new AbortController();
        this.requestQueue = Promise.resolve();
    }

    async validate(word: string): Promise<ValidationResult> {
        const currentSignal = this.queueAbortController.signal;
  
        this.requestQueue = this.requestQueue.then(async () => {
            if (currentSignal.aborted) throw new DOMException('Aborted', 'AbortError');
  
            await this.enforceDelay(currentSignal);
  
            return this.fetchFromApi(word, currentSignal);
        });
  
        return this.requestQueue;
    }

    private async enforceDelay(signal: AbortSignal): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.minIntervalMs) {
            const delayNeeded = this.minIntervalMs - timeSinceLastRequest;

            await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(() => {
                    signal.removeEventListener('abort', onAbort);
                    resolve();
                }, delayNeeded);

                const onAbort = () => {
                    clearTimeout(timer);
                    reject(new DOMException('Aborted during throttling delay', 'AbortError'));
                };

                // Listen for abort events while the timer runs
                signal.addEventListener('abort', onAbort);
            });
        }

        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        this.lastRequestTime = Date.now();
    }

    private async fetchFromApi(word: string, signal: AbortSignal): Promise<ValidationResult> {
        return this.externalAPI.validate(word, signal);
    }
}

