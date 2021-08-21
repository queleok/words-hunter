/**
 * @jest-environment puppeteer
 */

import { ElementHandle, HTTPRequest } from 'puppeteer';

const timeout = 10000;

async function getPropertyUnsafe(eh: ElementHandle, property: string): Promise<string> {
    return await (await eh.getProperty(property))!.jsonValue();
}

let getRequestMock = (word: string | undefined) => {
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
        request.respond(getRequestMock(word));
    } else request.continue();
};

const send_first_n_letters = async (n: number): Promise<string> => {
    const letters = await page.$$('.cell');
    let counter = 0;
    let word = '';
    for (const letter of letters) {
        await letter.click();
        word += await getPropertyUnsafe(letter, 'textContent');
        counter++;
        if (counter == n) break;
    }
    const send = (await page.$('#publish'))!;
    return send.click()
        .then(() => {
            return page.waitForSelector('.pending-score', { timeout: 10 });
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

test('Confirm words are published in the reversed order, and that successfully resolved words have respective class', async () => {
    getRequestMock = (word: string | undefined) => {
        return {
            status: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            contentType: 'application/json',
            body: `[{ "word": "${word}", "meanings": [ { "partOfSpeech": "stub", "definitions": [ { "definition": "stub" } ]}]}]`
        };
    };

    const first_word = (await send_first_n_letters(3))!;

    const first_word_eh = (await page.waitForSelector('.success'))!;
    const published_first_word = (await getPropertyUnsafe(first_word_eh, 'textContent'))!;
    expect(published_first_word).toBe(first_word);

    const second_word = (await send_first_n_letters(4))!;

    const moved_first_word_eh = (await page.waitForSelector('.success ~ .success'))!;
    const moved_published_first_word = (await getPropertyUnsafe(moved_first_word_eh, 'textContent'))!;
    expect(moved_published_first_word).toBe(first_word);

    const second_word_eh = (await page.$('.success'))!;
    const published_second_word = (await getPropertyUnsafe(second_word_eh, 'textContent'))!;
    expect(published_second_word).toBe(second_word);
}, timeout);

test('Confirm failed word has respective class', async () => {
    getRequestMock = (word: string | undefined) => {
        return {
            status: 404,
            headers: { "Access-Control-Allow-Origin": "*" },
            contentType: 'application/json',
            body: `[ "Word '${word}' not found" ]`
        };
    };

    const first_word = (await send_first_n_letters(3))!;

    const first_word_eh = (await page.waitForSelector('.failure'))!;
    const published_first_word = (await getPropertyUnsafe(first_word_eh, 'textContent'))!;
    expect(published_first_word).toBe(first_word);
}, timeout);

test('Confirm recoverably failed word has respective class', async () => {
    getRequestMock = (word: string | undefined) => {
        return {
            status: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            contentType: 'application/json',
            body: `[ "Something went wrong" ]`
        };
    };

    const first_word = (await send_first_n_letters(3))!;

    const first_word_eh = (await page.waitForSelector('.network-failure'))!;
    const published_first_word = (await getPropertyUnsafe(first_word_eh, 'textContent'))!;
    expect(published_first_word).toBe(first_word);
}, timeout);
