/**
 * DictionaryFetchAdapter implements IFetchAdapter using a standard dictionary API (e.g., Google).
 */
class DictionaryFetchAdapter {
    getRequestUrl(word) {
        return `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    }
    getReferenceUrl(word) {
        return this.getRequestUrl(word);
    }
    async validate(word) {
        try {
            const response = await fetch(this.getRequestUrl(word));
            if (response.ok) {
                const data = await response.json();
                if (validateWord(data)) {
                    return "success";
                }
                else {
                    return "validation-failure";
                }
            }
            else if (response.status === 404) {
                return "no-definition";
            }
            else {
                // Handle other HTTP errors
                throw new Error(`${response.status}`);
            }
        }
        catch (e) {
            console.error("Dictionary API fetch failed:", e);
            return "network-failure";
        }
    }
}
/**
 * WiktionaryFetchAdapter implements IFetchAdapter using the Wiktionary API.
 */
class WiktionaryFetchAdapter {
    constructor(language) {
        this.language = "English";
        this.language = language;
    }
    getRequestUrl(word) {
        // Use action=parse to get categories instead of query results
        return `https://en.wiktionary.org/w/api.php?action=parse&format=json&formatversion=2&page=${encodeURIComponent(word)}&prop=categories&origin=*`;
    }
    getReferenceUrl(word) {
        return `https://en.wiktionary.org/wiki/${word}#${this.language}`;
    }
    async validate(word) {
        try {
            const response = await fetch(this.getRequestUrl(word));
            if (!response.ok) {
                throw new Error(`${response.status}`);
            }
            const data = await response.json();
            // Check if the word is categorized as a target type (e.g., English Noun, Verb, etc.)
            if (checkIfCategorizedAsTargetType(data, this.language, ["nouns", "noun_forms", "verbs", "verb_forms", "adjectives", "adjective_forms", "adverbs", "adverb_forms", "pronouns", "pronoun_forms", "prepositions", "conjuctions"])) {
                return "success";
            }
            else {
                return "no-definition"; // Use no-definition for non-existence in target language/type
            }
        }
        catch (e) {
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
function checkIfCategorizedAsTargetType(response, targetLanguage, partsOfSpeech) {
    var _a;
    const categories = ((_a = response.parse) === null || _a === void 0 ? void 0 : _a.categories) || [];
    return categories.some((cat) => partsOfSpeech.some((pos) => cat.category.includes(`${targetLanguage}_${pos}`)));
}
class PromiseQueue {
    constructor(validator, time_scale = 1) {
        this.curr = { item: Promise.resolve("success") };
        this.begin = { item: Promise.resolve("success"), next: this.curr };
        this.length = 0;
        this.time_scale = time_scale;
        this.validator = validator;
    }
    enqueue(word) {
        this.length++;
        const q = this;
        const ret = new Promise(function (resolve, reject) {
            q.curr.item.finally(() => {
                setTimeout(() => {
                    q.validator.validate(word)
                        .then((result) => resolve(result))
                        .finally(() => q.dequeue());
                }, 500 * q.time_scale);
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
        this.depletion_cb = cb;
        if (this.length <= 0)
            this.depletion_cb();
    }
}
function validateWord(words) {
    const is_there_non_abbreviation = words.some((word) => word.meanings.length == 0
        || !word.meanings.every(meaning => (meaning.partOfSpeech == "abbreviation")
            || meaning.definitions.every(def => def.definition.startsWith("short for "))));
    return is_there_non_abbreviation;
}
export { PromiseQueue, DictionaryFetchAdapter, WiktionaryFetchAdapter };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVldWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc2NyaXB0cy9xdWV1ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUErQ0E7O0dBRUc7QUFDSCxNQUFNLHNCQUFzQjtJQUN4QixhQUFhLENBQUMsSUFBWTtRQUN0QixPQUFPLG1EQUFtRCxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0lBQ3pGLENBQUM7SUFFRCxlQUFlLENBQUMsSUFBWTtRQUN4QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBWTtRQUN2QixJQUFJLENBQUM7WUFDRCxNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFdkQsSUFBSSxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2QsTUFBTSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ25DLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3JCLE9BQU8sU0FBUyxDQUFDO2dCQUNyQixDQUFDO3FCQUFNLENBQUM7b0JBQ0osT0FBTyxvQkFBb0IsQ0FBQztnQkFDaEMsQ0FBQztZQUNMLENBQUM7aUJBQU0sSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUNqQyxPQUFPLGVBQWUsQ0FBQztZQUMzQixDQUFDO2lCQUFNLENBQUM7Z0JBQ0osMkJBQTJCO2dCQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDMUMsQ0FBQztRQUNMLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsRUFBRSxDQUFDLENBQUMsQ0FBQztZ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