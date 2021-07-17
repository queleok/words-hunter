class PromiseQueue {
    constructor() {
        this.curr = { item: Promise.resolve("success") };
        this.begin = { item: Promise.resolve("success"), next: this.curr };
        this.length = 0;
    }
    enqueue(word) {
        this.length++;
        const q = this;
        const ret = new Promise(function (resolve, reject) {
            q.curr.item.finally(() => {
                setTimeout(function () {
                    fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word)
                        .then(function (response) {
                        if (response.ok)
                            return response.json();
                        else
                            return Promise.reject(response.status);
                    })
                        .then(function (data) {
                        if (validateWord(data))
                            resolve("success");
                        else
                            resolve("validation-failure");
                    })
                        .catch(function (error) {
                        if (error === 404)
                            resolve("no-definition");
                        else
                            resolve("network-failure");
                    })
                        .finally(() => { q.dequeue(); });
                }, 500);
            });
        });
        this.curr.next = { item: ret };
        this.curr = this.curr.next;
        return ret;
    }
    dequeue() {
        if (this.begin.next !== undefined)
            this.begin = this.begin.next;
        if (this.length > 0) {
            this.length--;
            if (this.length == 0 && this.depletion_cb !== undefined)
                this.depletion_cb();
        }
        else {
            console.log("something went wrong, attempt to dequeue empty queue was registered");
        }
    }
    deplete(cb) {
        if (this.length > 0)
            this.depletion_cb = cb;
        else
            cb();
    }
}
function validateWord(words) {
    const is_there_non_abbreviation = words.some((word) => word.meanings.length == 0
        || !word.meanings.every(meaning => (meaning.partOfSpeech == "abbreviation")
            || meaning.definitions.every(def => def.definition.startsWith("short for "))));
    return is_there_non_abbreviation;
}
export { PromiseQueue };
