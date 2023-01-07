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
function escapeMissingLetters(word, freqmap) {
    const freq = [...freqmap];
    let valid = true;
    let ret = '';
    let open = '<s>';
    let close = '';
    for (let i = 0; i < word.length; i++) {
        const chr = word.charAt(i);
        if (--freq[getLetterOrdinalNumber(chr)] < 0) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NjcmlwdHMvZm9ybWF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLHVCQUF1QixDQUFBO0FBRTlELFNBQVMsY0FBYyxDQUFDLE1BQWM7SUFDbEMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDNUIsSUFBUyxNQUFNLEdBQUcsQ0FBQztRQUFFLE9BQU8sSUFBSSxDQUFDO1NBQzVCLElBQUksTUFBTSxHQUFHLEVBQUU7UUFBRSxPQUFPLEdBQUcsR0FBRyxNQUFNLENBQUM7SUFDMUMsT0FBTyxFQUFFLEdBQUcsTUFBTSxDQUFDO0FBQ3ZCLENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxHQUFXO0lBQzNCLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2QsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUN0QixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDMUIsSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUFDM0IsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsR0FBVztJQUM3QixJQUFJLEdBQUcsR0FBRyxFQUFFO1FBQUUsT0FBTyxJQUFJLEdBQUcsR0FBRyxDQUFDO1NBQzNCLElBQUksR0FBRyxHQUFHLEdBQUc7UUFBRSxPQUFPLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDckMsT0FBTyxFQUFFLEdBQUcsR0FBRyxDQUFDO0FBQ3BCLENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUFDLElBQVksRUFBRSxPQUFzQjtJQUM5RCxNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUM7SUFFMUIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBRWpCLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztJQUNqQixJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7SUFFZixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNsQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNCLElBQUksRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDekMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNkLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ2xCLElBQUksR0FBRyxFQUFFLENBQUM7WUFDVixLQUFLLEdBQUcsTUFBTSxDQUFDO1NBQ2xCO2FBQU07WUFDSCxHQUFHLElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQztZQUNuQixJQUFJLEdBQUcsS0FBSyxDQUFDO1lBQ2IsS0FBSyxHQUFHLEVBQUUsQ0FBQztTQUNkO0tBQ0o7SUFFRCxJQUFJLEtBQUs7UUFBRSxPQUFPLElBQUksQ0FBQztJQUV2QixHQUFHLElBQUksS0FBSyxDQUFDO0lBQ2IsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBRUQsMEhBQTBIO0FBQzFILFNBQVMsWUFBWSxDQUFDLEdBQVc7SUFDN0IsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLHVCQUF1QixFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsb0NBQW9DO0FBQzdGLENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUFDLEdBQVc7SUFDckMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUN6QyxDQUFDO0FBRUQsT0FBTyxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsb0JBQW9CLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixFQUFFLENBQUMifQ==