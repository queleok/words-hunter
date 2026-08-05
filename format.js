import { getLetterOrdinalNumber } from './generate-letters.js';
function formatTimeSlot(amount) {
    amount = Math.floor(amount);
    if (amount < 0)
        return '00';
    else if (amount < 10)
        return '0' + amount;
    return '' + amount;
}
function formatTime(sec) {
    let mins = sec > 0
        ? Math.floor(sec / 60)
        : Math.ceil(sec / 60);
    let secs = sec - mins * 60;
    return formatTimeSlot(mins) + ':' + formatTimeSlot(secs);
}
function formatResult(res) {
    if (res < 10)
        return '  ' + res;
    else if (res < 100)
        return ' ' + res;
    return '' + res;
}
function escapeMissingLetters(word, freqmap, lang = 'en') {
    const freq = [...freqmap];
    let valid = true;
    let ret = '';
    let open = '<s>';
    let close = '';
    for (let i = 0; i < word.length; i++) {
        const chr = word.charAt(i);
        if (--freq[getLetterOrdinalNumber(chr, lang)] < 0) {
            valid = false;
            ret += open + chr;
            open = '';
            close = '</s>';
        }
        else {
            ret += close + chr;
            open = '<s>';
            close = '';
        }
    }
    if (valid)
        return null;
    ret += close;
    return ret;
}
// shamelessly copy-pasted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
function escapeRegExp(str) {
    return str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function filterNonAlphabetics(str) {
    return str.replace(/[^a-zA-Z]+/g, '');
}
export { formatTime, formatResult, escapeMissingLetters, escapeRegExp, filterNonAlphabetics };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NjcmlwdHMvZm9ybWF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBZ0Isc0JBQXNCLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQTtBQUU1RSxTQUFTLGNBQWMsQ0FBQyxNQUFjO0lBQ2xDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzVCLElBQVMsTUFBTSxHQUFHLENBQUM7UUFBRSxPQUFPLElBQUksQ0FBQztTQUM1QixJQUFJLE1BQU0sR0FBRyxFQUFFO1FBQUUsT0FBTyxHQUFHLEdBQUcsTUFBTSxDQUFDO0lBQzFDLE9BQU8sRUFBRSxHQUFHLE1BQU0sQ0FBQztBQUN2QixDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsR0FBVztJQUMzQixJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNkLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDdEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQzFCLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQzNCLE9BQU8sY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0QsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLEdBQVc7SUFDN0IsSUFBSSxHQUFHLEdBQUcsRUFBRTtRQUFFLE9BQU8sSUFBSSxHQUFHLEdBQUcsQ0FBQztTQUMzQixJQUFJLEdBQUcsR0FBRyxHQUFHO1FBQUUsT0FBTyxHQUFHLEdBQUcsR0FBRyxDQUFDO0lBQ3JDLE9BQU8sRUFBRSxHQUFHLEdBQUcsQ0FBQztBQUNwQixDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFZLEVBQUUsT0FBc0IsRUFBRSxPQUFxQixJQUFJO0lBQ3pGLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztJQUUxQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7SUFFakIsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ2IsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDO0lBQ2pCLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUVmLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDbkMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQixJQUFJLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2hELEtBQUssR0FBRyxLQUFLLENBQUM7WUFDZCxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQztZQUNsQixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ1YsS0FBSyxHQUFHLE1BQU0sQ0FBQztRQUNuQixDQUFDO2FBQU0sQ0FBQztZQUNKLEdBQUcsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDO1lBQ25CLElBQUksR0FBRyxLQUFLLENBQUM7WUFDYixLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ2YsQ0FBQztJQUNMLENBQUM7SUFFRCxJQUFJLEtBQUs7UUFBRSxPQUFPLElBQUksQ0FBQztJQUV2QixHQUFHLElBQUksS0FBSyxDQUFDO0lBQ2IsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBRUQsMEhBQTBIO0FBQzFILFNBQVMsWUFBWSxDQUFDLEdBQVc7SUFDN0IsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLHVCQUF1QixFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsb0NBQW9DO0FBQzdGLENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUFDLEdBQVc7SUFDckMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUN6QyxDQUFDO0FBRUQsT0FBTyxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsb0JBQW9CLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixFQUFFLENBQUMifQ==