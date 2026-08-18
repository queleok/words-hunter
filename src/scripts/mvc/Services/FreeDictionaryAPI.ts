import { WordData, Definition } from '../../queue.js';
import { ValidationResult } from '../Models/ValidationResult.js';
import { ExternalAPI } from './ExternalAPI.js';

export class FreeDictionaryAPI extends ExternalAPI {
    getRequestUrl(word: string): string {
        return `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    }

    getReferenceUrl(word: string): string {
        return this.getRequestUrl(word);
    }

    async validate(word: string, signal: AbortSignal): Promise<ValidationResult> {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

        try {
            const response = await fetch(this.getRequestUrl(word), { signal });

            if (response.ok) {
                const data = await response.json();
                if (this.isValidWord(data)) {
                    return { word: word, status: 'valid' };
                } else {
                    return { word: word, status: 'invalid' };
                }
            } else if (response.status === 404) {
                return { word: word, status: 'invalid' };
            } else {
                throw new Error(`${response.status}`);
            }
        } catch (e) {
            console.error("Dictionary API fetch failed:", e);
            return { word: word, status: 'stale' };
        }
    }

    private isValidWord(data: Array<WordData>): boolean {
        // Dictionary API returns array of entries; each entry has meanings
        if (!Array.isArray(data)) return false;
        for (const entry of data) {
            const meanings = entry.meanings || [];
            if (meanings.length === 0) continue;
            for (const meaning of meanings) {
                if (meaning.partOfSpeech === 'abbreviation') continue;
                if (meaning.definitions?.every((def: Definition) => def.definition.startsWith('short for '))) continue;
                return true;
            }
        }
        return false;
    }
}
