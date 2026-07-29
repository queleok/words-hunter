type FetchResult = "success" | "validation-failure" | "no-definition" | "network-failure"

type Item = Promise<FetchResult>;
type Node = {
    item: Item,
    next?: Node
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
    // Other fields might exist but are not strictly needed for existence check
}
// -----------------------------


class PromiseQueue {
    private begin: Node;
    private curr: Node;
    private length: number;
    private depletion_cb?: () => void;
    private time_scale: number;
    private validatorType: 'dictionary' | 'wiktionary';

    constructor(time_scale = 1) {
        this.curr = { item: Promise.resolve("success")  };
        this.begin = { item: Promise.resolve("success"), next: this.curr };
        this.length = 0;
        this.time_scale = time_scale;
        // Default to dictionary API for backward compatibility if not set externally
        this.validatorType = 'dictionary';
    }

    setValidator(type: 'dictionary' | 'wiktionary') {
        this.validatorType = type;
    }

    enqueue(this: PromiseQueue, word: string): Promise<FetchResult> {
        this.length++;
        const q = this;
        const ret = new Promise<FetchResult>( function(resolve, reject) {
            q.curr.item.finally( () => {
                setTimeout( function() {
                    if (q.validatorType === 'dictionary') {
                        // --- Dictionary API Path ---
                        fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word)
                            .then(function(response) {
                                if (response.ok) return response.json();
                                else             return Promise.reject(response.status);
                            })
                            .then(function(data) {
                                if (validateWord(data)) resolve("success");
                                else                    resolve("validation-failure");
                            })
                            .catch(function(error) {
                                if (error === 404) resolve("no-definition");
                                else               resolve("network-failure");
                            })
                            .finally(() => { q.dequeue(); });

                    } else if (q.validatorType === 'wiktionary') {
                        // --- Wiktionary API Path ---
                        const wiktionaryUrl = `https://en.wiktionary.org/w/api.php?action=query&format=json&formatversion=2&titles=${encodeURIComponent(word)}&origin=*`;

                        fetch(wiktionaryUrl)
                            .then((response: Response) => {
                                if (!response.ok) throw new Error('Network response was not ok');
                                return response.json() as Promise<WiktionaryResponse>;
                            })
                            .then((data: WiktionaryResponse) => {
                                const isPresent = isWordPresentInWiktionary(data);
                                if (isPresent) resolve("success");
                                else resolve("no-definition"); // Use no-definition for non-existence
                            })
                            .catch(() => {
                                resolve("network-failure");
                            })
                            .finally(() => { q.dequeue(); });
                    } else {
                        // Should not happen
                        q.curr.item.finally(() => q.dequeue());
                    }
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

interface Definition {
    definition: string
}

interface Meaning {
    partOfSpeech: string,
    definitions: Array<Definition>
}

interface Word {
    meanings: Array<Meaning>
}

function validateWord(words: Array<Word>): boolean {
    const is_there_non_abbreviation = words.some( (word: Word) =>
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

    // Check if the 'pages' object exists and has entries. 
    // If pages exist, it means MediaWiki found an entry for that title.
    return query.pages.length > 0 && query.pages.some((p) => p.hasOwnProperty('pageid'));
}


export {PromiseQueue, FetchResult};
