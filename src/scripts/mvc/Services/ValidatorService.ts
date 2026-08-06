import { FetchResult } from '../../queue.js';

/**
 * Abstract service for word validation. Subclasses implement specific API adapters.
 */
export abstract class ValidatorService {
    abstract getRequestUrl(word: string): string;
    abstract getReferenceUrl(word: string): string;
    abstract validate(word: string): Promise<FetchResult>;
}
