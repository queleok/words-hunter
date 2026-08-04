type FetchResult = "success" | "validation-failure" | "no-definition" | "network-failure"

type Item = Promise<FetchResult>;
type Node = {
    item: Item,
    next?: Node
}

// --- Unofficial Google Dict API types ---
interface Definition {
    definition: string
}

interface Meaning {
    partOfSpeech: string,
    definitions: Array<Definition>
}

interface WordData {
    meanings: Array<Meaning>
}

// --- Wiktionary API Types (Updated for Parse action) ---
interface WiktionaryCategory {
    sortkey: string;
    category: string;
}

interface WiktionaryResponse {
    parse: {
        title: string;
        pageid?: number;
        categories: Array<WiktionaryCategory>;
    };
}

// -------------------

/**
 * IFetchAdapter defines the contract for all word validation strategies.
 */
interface IFetchAdapter {
    url(word: string): string;
    validate(word: string): Promise<FetchResult>;
}

/**
 * DictionaryFetchAdapter implements IFetchAdapter using a standard dictionary API (e.g., Google).
 */
class DictionaryFetchAdapter implements IFetchAdapter {
    url(word: string): string {
        return `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    }

    async validate(word: string): Promise<FetchResult> {
        try {
            const response = await fetch(this.url(word));

            if (response.ok) {
                const data = await response.json();
                if (validateWord(data)) {
                    return "success";
                } else {
                    return "validation-failure";
                }
            } else if (response.status === 404) {
                return "no-definition";
            } else {
                // Handle other HTTP errors
                throw new Error(`${response.status}`);
            }
        } catch (e) {
            console.error("Dictionary API fetch failed:", e);
            return "network-failure";
        }
    }
}

/**
 * WiktionaryFetchAdapter implements IFetchAdapter using the Wiktionary API.
 */
class WiktionaryFetchAdapter implements IFetchAdapter {
    private language: string = "English";

    constructor(language: string) {
        this.language = language;
    }

    url(word: string): string {
        // Use action=parse to get categories instead of query results
        return `https://en.wiktionary.org/w/api.php?action=parse&format=json&formatversion=2&page=${encodeURIComponent(word)}&prop=categories&origin=*`;
    }

    async validate(word: string): Promise<FetchResult> {
        try {
            const response = await fetch(this.url(word));
            if (!response.ok) {
                throw new Error(`${response.status}`); 
            }

            const data: WiktionaryResponse = await response.json();

            // Check if the word is categorized as a target type (e.g., English Noun, Verb, etc.)
            if (checkIfCategorizedAsTargetType(data, this.language, ["nouns", "noun_forms", "verbs", "verb_forms", "adjectives", "adjective_forms", "adverbs", "adverb_forms", "pronouns", "pronoun_forms", "prepositions", "conjuctions"])) {
                return "success";
            } else {
                return "no-definition"; // Use no-definition for non-existence in target language/type
            }
        } catch (e) {
            console.error("Wiktionary API fetch failed: ", e);
            return "network-failure";
        }
    }
}

/**
 * Checks if the Wiktionary response contains categories matching a specific language and part of speech.
 * @param response The parsed JSON response from action=parse.
 * @param targetLanguage The language code (e.g., 'English').
 * @param partsOfSpeech An array of desired parts of speech (e.g., ['nouns', 'verbs']).
 * @returns True if a matching category is found, false otherwise.
 */
function checkIfCategorizedAsTargetType(response: WiktionaryResponse, targetLanguage: string, partsOfSpeech: Array<string>): boolean {
    const categories = response.parse?.categories || [];

    return categories.some((cat) =>
        partsOfSpeech.some((pos) => cat.category.includes(`${targetLanguage}_${pos}`))
    );
}

class PromiseQueue {
    private begin: Node;
    private curr: Node;
    private length: number;
    private depletion_cb?: () => void;
    private time_scale: number;
    private validator: IFetchAdapter;

    constructor(validator: IFetchAdapter, time_scale = 1) {
        this.curr = { item: Promise.resolve("success")  };
        this.begin = { item: Promise.resolve("success"), next: this.curr };
        this.length = 0;
        this.time_scale = time_scale;
        this.validator = validator;
    }

    enqueue(this: PromiseQueue, word: string): Promise<FetchResult> {
        this.length++;
        const q = this;
        const ret = new Promise<FetchResult>( function(resolve, reject) {
            q.curr.item.finally( () => {
                setTimeout( () => {
                    q.validator.validate(word)
                        .then((result: FetchResult) => resolve(result))
                        .finally( () => q.dequeue())
                }, 500 * q.time_scale);
            });
        });
        this.curr.next = { item: ret };
        this.curr = this.curr.next;
        return ret;
    }

    private dequeue(this: PromiseQueue) {
        if (this.begin.next !== undefined) this.begin = this.begin.next;
        if (this.length > 0) {
            this.length--;
            if (this.length == 0 && this.depletion_cb !== undefined) this.depletion_cb();
        } else {
            console.log("something went wrong, attempt to dequeue empty queue was registered");
        }
    }

    deplete(this: PromiseQueue, cb: () => void) {
        this.depletion_cb = cb;
        if (this.length <= 0) this.depletion_cb();
    }
}

function validateWord(words: Array<WordData>): boolean {
    const is_there_non_abbreviation = words.some( (word: WordData) =>
        word.meanings.length == 0 
        || !word.meanings.every( meaning =>
            (meaning.partOfSpeech == "abbreviation")
            || meaning.definitions.every( def =>
                def.definition.startsWith("short for "))));
    return is_there_non_abbreviation;
}

export {PromiseQueue, FetchResult, IFetchAdapter, DictionaryFetchAdapter, WiktionaryFetchAdapter};
