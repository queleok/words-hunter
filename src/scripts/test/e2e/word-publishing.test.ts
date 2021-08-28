/**
 * @jest-environment puppeteer
 */

import { ElementHandle, HTTPRequest } from 'puppeteer';

const timeout = 10000;

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

const sendByButton = async () => {
    const send = await page.$('#publish');
    expect(send).toBeDefined();
    return send!.click();
}

const sendByKeyboard = async () => {
    return page.keyboard.press('Enter');
}

const type_first_n_letters = async (n: number): Promise<string> => {
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

const send_first_n_letters = async (n: number, send: typeof sendByKeyboard): Promise<string> => {
    const word = (await type_first_n_letters(n))!;
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

test('Confirm words are published by pressing send button', async () => {
    await send_first_n_letters(3, sendByButton);
    await page.waitForSelector('.success');
}, timeout);

test('Confirm words are published by pressing Enter from the keyboard', async () => {
    await send_first_n_letters(3, sendByKeyboard);
    await page.waitForSelector('.success');
}, timeout);

test('Confirm words are not published if there are less than 3 letters or if there are invalid symbols', async () => {
    const expect_no_words_published = async () => {
        let success = await page.$$('.success');
        let failure = await page.$$('.failure');
        let pending = await page.$$('.pending-score');
        let recoverable_failure = await page.$$('.network-failure');
        const expect_zero_length = (arr: typeof success) => {
            expect(arr).toBeDefined();
            expect(arr!.length).toBe(0);
        };
        expect_zero_length(success);
        expect_zero_length(failure);
        expect_zero_length(pending);
        expect_zero_length(recoverable_failure);
    };

    await type_first_n_letters(2);
    await sendByKeyboard();
    await expect_no_words_published();
    await sendByButton();
    await expect_no_words_published();

    const input = (await page.$('input'))!;
    input.type("$#2!");

    await sendByKeyboard();
    await expect_no_words_published();
    await sendByButton();
    await expect_no_words_published();
}, timeout);
