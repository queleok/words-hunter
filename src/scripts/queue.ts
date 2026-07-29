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

// --- Wiktionary API Types ---
interface WiktionaryPageInfo {
    title: string;
    pageId?: string;
}

interface WiktionaryResponse {
    query: {
        pages: Array<WiktionaryPageInfo>;
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
    url(word: string): string {
        return `https://en.wiktionary.org/w/api.php?action=query&format=json&formatversion=2&titles=${encodeURIComponent(word)}&origin=*`;
    }

    async validate(word: string): Promise<FetchResult> {
        try {
            const response = await fetch(this.url(word));
            if (!response.ok) {
                throw new Error(`${response.status}`); 
            }

            const data: WiktionaryResponse = await response.json();

            // Check if the word exists in Wiktionary
            if (isWordPresentInWiktionary(data)) {
                return "success";
            } else {
                return "no-definition"; // Use no-definition for non-existence
            }
        } catch (e) {
            console.error("Wiktionary API fecth failed: ", e);
            return "network-failure";
        }
    }
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

function isWordPresentInWiktionary(response: WiktionaryResponse): boolean {
    const query = response?.query;
    if (!query) return false;

    return query.pages.length > 0 && query.pages.some((p) => p.hasOwnProperty('pageid'));
}

export {PromiseQueue, FetchResult, IFetchAdapter, DictionaryFetchAdapter, WiktionaryFetchAdapter};
