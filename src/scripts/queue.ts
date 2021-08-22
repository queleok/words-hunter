type FetchResult = "success" | "validation-failure" | "no-definition" | "network-failure"

type Item = Promise<FetchResult>;
type Node = {
    item: Item,
    next?: Node
}

class PromiseQueue {
    private begin: Node;
    private curr: Node;
    private length: number;
    private depletion_cb?: () => void;
    private time_scale: number;

    constructor(time_scale = 1) {
        this.curr = { item: Promise.resolve("success")  };
        this.begin = { item: Promise.resolve("success"), next: this.curr };
        this.length = 0;
        this.time_scale = time_scale;
    }

    enqueue(this: PromiseQueue, word: string): Promise<FetchResult> {
        this.length++;
        const q = this;
        const ret = new Promise<FetchResult>( function(resolve, reject) {
            q.curr.item.finally( () => {
                setTimeout( function() {
                    fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word)
                    .then(function(response) {
                        if (response.ok) return response.json();
                        else             return Promise.reject(response.status);
                    })
                    .then(function(this: PromiseQueue, data) {
                        if (validateWord(data)) resolve("success");
                        else                    resolve("validation-failure");
                    })
                    .catch(function(this: PromiseQueue, error) {
                        if (error === 404) resolve("no-definition");
                        else               resolve("network-failure");
                    })
                    .finally(() => { q.dequeue(); });
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

function validateWord(words: Array<Word>) {
    const is_there_non_abbreviation = words.some( (word: Word) =>
        word.meanings.length == 0 
        || !word.meanings.every( meaning =>
            (meaning.partOfSpeech == "abbreviation")
            || meaning.definitions.every( def =>
                def.definition.startsWith("short for "))));
    return is_there_non_abbreviation;
}

export {PromiseQueue, FetchResult};
