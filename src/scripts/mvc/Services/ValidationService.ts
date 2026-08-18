import { LanguageState } from '../Models/LanguageState.js';
import { ValidationResult } from '../Models/ValidationResult.js';
import { ExternalAPI } from './ExternalAPI.js';
import { WiktionaryAPI } from './WiktionaryAPI.js';
import { FreeDictionaryAPI } from './FreeDictionaryAPI.js';

export class ValidationService {
    private externalAPI: ExternalAPI;
    private externalAPItype: 'dictionary' | 'wiktionary' = 'wiktionary';
    private lastRequestTime: number = 0;
    private minIntervalMs: number = 500;
    private requestQueue: Promise<any> = Promise.resolve();
    private queueAbortController: AbortController = new AbortController();

    constructor(api?: 'dictionary' | 'wiktionary', language?: string) {
        this.externalAPItype = api || 'wiktionary';
        this.externalAPI = this.createAPI(this.externalAPItype, language || 'English');
    }

    private createAPI(api: 'dictionary' | 'wiktionary', language: string) {
        if (api === 'dictionary') return new FreeDictionaryAPI();

        return new WiktionaryAPI(language);
    }

    public reset(lang: LanguageState): void {
        this.externalAPI = this.createAPI(this.externalAPItype, lang.name);

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
