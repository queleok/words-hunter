import { ValidationResult } from '../Models/ValidationResult.js';

/**
 * Abstract service for word validation. Subclasses implement specific API adapters.
 */
export abstract class ExternalAPI {
    abstract getRequestUrl(word: string): string;
    abstract getReferenceUrl(word: string): string;
    abstract validate(word: string, signal: AbortSignal): Promise<ValidationResult>;
}
