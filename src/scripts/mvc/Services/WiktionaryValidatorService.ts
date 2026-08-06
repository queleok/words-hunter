import { FetchResult } from '../../queue.js';
import { ValidatorService } from './ValidatorService.js';

export class WiktionaryValidatorService extends ValidatorService {
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

    async validate(word: string): Promise<FetchResult> {
        try {
            const response = await fetch(this.getRequestUrl(word));
            if (!response.ok) {
                throw new Error(`${response.status}`);
            }

            const data = await response.json();
            if (this.isCategorizedAsTargetType(data)) {
                return "success";
            } else {
                return "no-definition";
            }
        } catch (e) {
            console.error("Wiktionary API fetch failed:", e);
            return "network-failure";
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
