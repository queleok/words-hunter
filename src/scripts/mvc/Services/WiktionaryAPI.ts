import { ValidationResult } from '../Models/ValidationResult.js';
import { ExternalAPI } from './ExternalAPI.js';

export class WiktionaryAPI extends ExternalAPI {
    private language: string;

    constructor(language: string) {
        super();
        this.language = language;
    }

    getRequestUrl(word: string): string {
        return `https://en.wiktionary.org/w/api.php?action=parse&format=json&formatversion=2&page=${encodeURIComponent(word)}&prop=categories&origin=*`;
    }

    getReferenceUrl(word: string): string {
        return `https://en.wiktionary.org/wiki/${word}#${this.language}`;
    }

    async validate(word: string, signal: AbortSignal): Promise<ValidationResult> {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

        try {
            const response = await fetch(this.getRequestUrl(word), { signal });
            if (!response.ok) {
                throw new Error(`${response.status}`);
            }

            const data = await response.json();
            if (this.isCategorizedAsTargetType(data)) {
                return { word: word, status: 'valid', referenceUrl: this.getReferenceUrl(word) };
            } else {
                return { word: word, status: 'invalid' };
            }
        } catch (e) {
            console.error("Wiktionary API fetch failed:", e);
            return { word: word, status: 'stale' };
        }
    }

    private isCategorizedAsTargetType(data: any): boolean {
        const categories = data.parse?.categories || [];
        const targetPartsOfSpeech = [
            'nouns', 'noun_forms', 'verbs', 'verb_forms',
            'adjectives', 'adjective_forms', 'adverbs', 'adverb_forms',
            'pronouns', 'pronoun_forms', 'prepositions'
        ];

        return categories.some((cat: any) =>
            targetPartsOfSpeech.some((pos) => cat.category.includes(`${this.language}_${pos}`))
        );
    }
}
