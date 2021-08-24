/**
 * @jest-environment puppeteer
 */

import { ElementHandle, HTTPRequest } from 'puppeteer';

const timeout = 10000;

async function getPropertyUnsafe(eh: ElementHandle, property: string): Promise<string> {
    return await (await eh.getProperty(property))!.jsonValue();
}

const getSuccessResponseMock = (word: string | undefined) => {
    return {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        contentType: 'application/json',
        body: `[{ "word": "${word}", "meanings": [ { "partOfSpeech": "stub", "definitions": [ { "definition": "stub" } ]}]}]`
    };
};

const getFailureResponseMock = (word: string | undefined) => {
    return {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        contentType: 'application/json',
        body: `[ "Word '${word}' not found" ]`
    };
}

const getRecoverableFailureResponseMock = (word: string | undefined) => {
    return {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        contentType: 'application/json',
        body: `[ "Something went wrong" ]`
    };
};

let getResponseMock = getSuccessResponseMock;

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

const send_first_n_letters = async (n: number, send: typeof sendByKeyboard): Promise<string> => {
    const letters = await page.$$('.cell');
    let counter = 0;
    let word = '';
    for (const letter of letters) {
        await letter.click();
        word += await getPropertyUnsafe(letter, 'textContent');
        counter++;
        if (counter == n) break;
    }
    return send()
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
    getResponseMock = getSuccessResponseMock;
    await send_first_n_letters(3, sendByButton);
    await page.waitForSelector('.success');
}, timeout);

test('Confirm words are published by pressing Enter from the keyboard', async () => {
    getResponseMock = getSuccessResponseMock;
    await send_first_n_letters(3, sendByKeyboard);
    await page.waitForSelector('.success');
}, timeout);

