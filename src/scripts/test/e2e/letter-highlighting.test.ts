/**
 * @jest-environment puppeteer
 */

import { ElementHandle, HTTPRequest } from 'puppeteer';

type LetterIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

const timeout = process.env.SLOWMO ? 60000 : 10000;

async function getPropertyUnsafe(eh: ElementHandle, property: string): Promise<string> {
    return await (await eh.getProperty(property))!.jsonValue();
}

const getResponseMock = (word: string | undefined) => {
    return {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        contentType: 'application/json',
        body: `[{ "word": "${word}", "meanings": [ { "partOfSpeech": "stub", "definitions": [ { "definition": "stub" } ]}]}]`
    };
};

const handler = (request: HTTPRequest) => {
    if (request.url().startsWith('https://api.dictionaryapi.dev/api/v2/entries/en/')) {
        const word = request.url().split('/').pop();
        request.respond(getResponseMock(word));
    } else request.continue();
};

const send = async () => {
    return page.keyboard.press('Enter');
}

const press_first_n_letter_buttons = async (n: number): Promise<string> => {
    const letters = await page.$$('.cell');
    let counter = 0;
    let word = '';
    for (const letter of letters) {
        await letter.click();
        word += await getPropertyUnsafe(letter, 'textContent');
        counter++;
        if (counter == n) break;
    }
    return word;
};

const send_first_n_letters = async (n: number): Promise<string> => {
    const word = (await press_first_n_letter_buttons(n))!;
    return send()
        .then(() => {
            return page.waitForSelector('.pending-score', { timeout: 50 });
        })
        .then((pending_word) => {
            if (pending_word) return getPropertyUnsafe(pending_word, 'textContent');
            else Promise.reject("Could not resolve pending word element handle");
        })
        .then((text_content) => {
            if (text_content) return text_content;
            else Promise.reject("Could not resolve text content of the element handle");
        })
        .then((resolved_word) => {
            expect(resolved_word).toBe(word);
            return word;
        });
};

const press_nth_letter_button = async (ix: LetterIndex): Promise<string> => {
    const letters = await page.$$('.cell');
    await letters[ix].click();
    const letter = await getPropertyUnsafe(letters[ix], 'textContent');
    return letter;
}

const get_sorted_generated_letters = async () => {
    const letters = await page.$$('.cell');
    let word = '';
    for (const letter_eh of letters) {
        const letter = await getPropertyUnsafe(letter_eh, 'textContent');
        word += letter;
    };
    return [...word].sort();
};

beforeAll(async () => {
    await page.goto("http://localhost:8080/play.html");
    await page.exposeFunction("_puppeteerGetSpeedup", () => { return 100; });
});

beforeEach(async () => {
    await page.reload();
    await page.setRequestInterception(true);
    page.on('request', handler);
});

afterEach(async () => {
    page.off('request', handler);
    await page.setRequestInterception(false);
});

test('Confirm pressing a letter button toggles its highlighting', async () => {
    const input = (await page.$('input'))!;

    const confirm_n_highlighted = async (n: number): Promise<Array<ElementHandle>> => {
        const letters = await page.$$('.cell.highlighted');
        expect(letters).toBeDefined();
        expect(letters!.length).toBe(n);
        return letters!;
    };

    const confirm_input_letters_equal = async (letters: string): Promise<string> => {
        const input_letters = await page.evaluate(x => x.value, input);
        expect(input_letters).toBeDefined();
        expect(input_letters!).toBe(letters);
        return input_letters;
    };

    const move_cursor = async (pos: number) => {
        return page.evaluate((x, pos) => x.setSelectionRange(pos, pos), input, pos);
    };

    const select = async (begin: number, end: number) => {
        return page.evaluate((x, b, e) => x.setSelectionRange(b, e), input, begin, end);
    }

    const confirm_highlighted_letters_are = (letters: string) => {
        return async (highlighted: Array<ElementHandle>) => {
            let word = '';
            for (const letter_eh of highlighted) {
                const letter = await getPropertyUnsafe(letter_eh, 'textContent');
                expect(letter).toBeDefined();
                word += letter;
            }
            expect(word).toBe(letters);
        }
    };

    const confirm_highlighted_sorted_letters_are = (letters: string) => {
        return async (highlighted: Array<ElementHandle>) => {
            let word = '';
            for (const letter_eh of highlighted) {
                const letter = await getPropertyUnsafe(letter_eh, 'textContent');
                expect(letter).toBeDefined();
                word += letter;
            }
            const sorted_letters = [...letters].sort();
            const sorted_word = [...word].sort();
            expect(sorted_word).toEqual(sorted_letters);
        }
    };

    const first_two_letters = await press_first_n_letter_buttons(2);
    await confirm_n_highlighted(2);
    await confirm_input_letters_equal(first_two_letters);

    await move_cursor(0);
    const third_letter = await press_nth_letter_button(2);
    await confirm_n_highlighted(3);
    await confirm_input_letters_equal(first_two_letters + third_letter);

    await press_nth_letter_button(1);
    await confirm_n_highlighted(2);
    await confirm_input_letters_equal(first_two_letters[0] + third_letter);

    await press_nth_letter_button(2);
    await press_nth_letter_button(0);
    await confirm_n_highlighted(0);
    await confirm_input_letters_equal('');

    await input.type(first_two_letters);
    await confirm_n_highlighted(2)
        .then(confirm_highlighted_letters_are(first_two_letters));

    await page.keyboard.press('Backspace');
    await confirm_n_highlighted(1);

    await press_first_n_letter_buttons(2);
    await confirm_n_highlighted(1)
        .then(confirm_highlighted_letters_are(first_two_letters[1]));

    await move_cursor(0);
    await input.type(third_letter);
    await confirm_n_highlighted(2)
        // NOTE: the sorted version is needed here to avoid issues with the first letter
        //       the being the same as the third one
        .then(confirm_highlighted_sorted_letters_are(first_two_letters[1] + third_letter));
    await confirm_input_letters_equal(third_letter + first_two_letters[1]);

    const generated_letters = await get_sorted_generated_letters();
    let missing_letter = 'a';
    let current_ix = 0;
    for (let i = 1; i < 26; ++i) {
        let shift_count = 0;
        for (; current_ix < generated_letters.length && generated_letters[current_ix] == missing_letter; ++current_ix) ++shift_count;
        if (shift_count == 0) break;
        missing_letter = String.fromCharCode('a'.charCodeAt(0) + i);
    }
    await input.type(missing_letter);
    await confirm_n_highlighted(2)
        .then(confirm_highlighted_sorted_letters_are(first_two_letters[1] + third_letter));
    await confirm_input_letters_equal(third_letter + missing_letter + first_two_letters[1]);

    await input.type(first_two_letters[0]);
    await confirm_n_highlighted(3)
        .then(confirm_highlighted_letters_are(first_two_letters + third_letter));
    await confirm_input_letters_equal(third_letter + missing_letter + first_two_letters);

    await page.keyboard.press('Backspace');
    await confirm_n_highlighted(2)
        .then(confirm_highlighted_sorted_letters_are(first_two_letters[1] + third_letter));
    await confirm_input_letters_equal(third_letter + missing_letter + first_two_letters[1]);

    await move_cursor(1);
    await page.keyboard.press('Backspace');
    await confirm_n_highlighted(1)
        .then(confirm_highlighted_letters_are(first_two_letters[1]));
    await confirm_input_letters_equal(missing_letter + first_two_letters[1]);

    await press_nth_letter_button(1);
    await page.keyboard.down('Control');
    await input.press('KeyV', { text: first_two_letters + missing_letter });
    await confirm_n_highlighted(2)
        .then(confirm_highlighted_letters_are(first_two_letters));
    await confirm_input_letters_equal(missing_letter + first_two_letters + missing_letter);
    await page.keyboard.up('Control');

    await move_cursor(0);
    await page.keyboard.down('Control');
    await input.press('KeyV', { text: missing_letter + third_letter });
    await confirm_n_highlighted(3)
        .then(confirm_highlighted_letters_are(first_two_letters + third_letter));
    await confirm_input_letters_equal(missing_letter + third_letter + missing_letter + first_two_letters + missing_letter);
    await page.keyboard.up('Control');

    await select(1,3);
    await input.press('Delete');
    await confirm_n_highlighted(2)
        .then(confirm_highlighted_letters_are(first_two_letters));
    await confirm_input_letters_equal(missing_letter + first_two_letters + missing_letter);

    await page.keyboard.down('Control');
    await input.press('KeyV', { text: missing_letter + third_letter });
    await confirm_n_highlighted(3)
        .then(confirm_highlighted_letters_are(first_two_letters + third_letter));
    await confirm_input_letters_equal(missing_letter + missing_letter + third_letter + first_two_letters + missing_letter);
    await page.keyboard.up('Control');

    const more_letters = generated_letters.join('').replace(first_two_letters[0], '').replace(first_two_letters[1], '').replace(third_letter, '').substr(0, 3);
    await select(2, 5);
    await page.keyboard.down('Control');
    await input.press('KeyV', { text: more_letters});
    await confirm_n_highlighted(3)
        .then(confirm_highlighted_sorted_letters_are(more_letters));
    await confirm_input_letters_equal(missing_letter + missing_letter + more_letters + missing_letter);
    await page.keyboard.up('Control');

    await send();
    await page.waitForSelector('.failure', { timeout: 50 });
    await confirm_n_highlighted(0);
    await confirm_input_letters_equal('');

    const all_third_letters = generated_letters.filter(letter => letter == third_letter).join('');
    await input.type(all_third_letters);
    await confirm_n_highlighted(all_third_letters.length);
    await confirm_input_letters_equal(all_third_letters);

    await input.type(third_letter);
    await confirm_n_highlighted(all_third_letters.length);
    await confirm_input_letters_equal(all_third_letters + third_letter);

    await press_nth_letter_button(2);
    await confirm_n_highlighted(all_third_letters.length);
    await confirm_input_letters_equal(all_third_letters);
}, timeout);

