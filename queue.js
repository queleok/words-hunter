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
export { PromiseQueue };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVldWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc2NyaXB0cy9xdWV1ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFRQSxNQUFNLFlBQVk7SUFNZDtRQUNJLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRyxDQUFDO1FBQ2xELElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ25FLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxPQUFPLENBQXFCLElBQVk7UUFDcEMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2QsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ2YsTUFBTSxHQUFHLEdBQUcsSUFBSSxPQUFPLENBQWUsVUFBUyxPQUFPLEVBQUUsTUFBTTtZQUMxRCxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsR0FBRyxFQUFFO2dCQUN0QixVQUFVLENBQUU7b0JBQ1IsS0FBSyxDQUFDLGtEQUFrRCxHQUFHLElBQUksQ0FBQzt5QkFDL0QsSUFBSSxDQUFDLFVBQVMsUUFBUTt3QkFDbkIsSUFBSSxRQUFRLENBQUMsRUFBRTs0QkFBRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7NEJBQ3ZCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzVELENBQUMsQ0FBQzt5QkFDRCxJQUFJLENBQUMsVUFBNkIsSUFBSTt3QkFDbkMsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDOzRCQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzs7NEJBQ25CLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO29CQUMxRCxDQUFDLENBQUM7eUJBQ0QsS0FBSyxDQUFDLFVBQTZCLEtBQUs7d0JBQ3JDLElBQUksS0FBSyxLQUFLLEdBQUc7NEJBQUUsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDOzs0QkFDekIsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7b0JBQ2xELENBQUMsQ0FBQzt5QkFDRCxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNaLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQzNCLE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUVPLE9BQU87UUFDWCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVM7WUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQ2hFLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDakIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2QsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLFNBQVM7Z0JBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1NBQ2hGO2FBQU07WUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLHFFQUFxRSxDQUFDLENBQUM7U0FDdEY7SUFDTCxDQUFDO0lBRUQsT0FBTyxDQUFxQixFQUFjO1FBQ3RDLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ3ZCLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQzlDLENBQUM7Q0FFSjtBQWVELFNBQVMsWUFBWSxDQUFDLEtBQWtCO0lBQ3BDLE1BQU0seUJBQXlCLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBRSxDQUFDLElBQVUsRUFBRSxFQUFFLENBQ3pELElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUM7V0FDdEIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBRSxPQUFPLENBQUMsRUFBRSxDQUMvQixDQUFDLE9BQU8sQ0FBQyxZQUFZLElBQUksY0FBYyxDQUFDO2VBQ3JDLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBQyxFQUFFLENBQ2hDLEdBQUcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELE9BQU8seUJBQXlCLENBQUM7QUFDckMsQ0FBQztBQUVELE9BQU8sRUFBQyxZQUFZLEVBQWMsQ0FBQyJ9