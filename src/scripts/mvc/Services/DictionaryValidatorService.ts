import { FetchResult, WordData, Definition } from '../../queue.js';
import { ValidatorService } from './ValidatorService.js';

export class DictionaryValidatorService extends ValidatorService {
    getRequestUrl(word: string): string {
        return `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    }

    getReferenceUrl(word: string): string {
        return this.getRequestUrl(word);
    }

    async validate(word: string): Promise<FetchResult> {
        try {
            const response = await fetch(this.getRequestUrl(word));

            if (response.ok) {
                const data = await response.json();
                if (this.isValidWord(data)) {
                    return "success";
                } else {
                    return "validation-failure";
                }
            } else if (response.status === 404) {
                return "no-definition";
            } else {
                throw new Error(`${response.status}`);
            }
        } catch (e) {
            console.error("Dictionary API fetch failed:", e);
            return "network-failure";
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
