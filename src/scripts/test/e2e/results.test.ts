/**
 * @jest-environment puppeteer
 */

import { ElementHandle, HTTPRequest } from 'puppeteer';

const timeout = 10000;
let speedup = 100;
let response_timeout = 0;

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
        setTimeout(() => {
            request.respond(getResponseMock(word));
        }, response_timeout);
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

const assert_score = async (result_eh: ElementHandle | null, score: number): Promise<boolean> => {
    expect(result_eh).toBeDefined();

    const result_text = await getPropertyUnsafe(result_eh!, 'textContent');
    expect(result_text).toBeDefined();

    const match_number = /\d+$/g;
    const results = result_text!.match(match_number);
    expect(results).toBeDefined();
    expect(results!.length).toBe(1);

    const result = parseInt(results![0], 10);
    expect(result).toBe(score);
    return Promise.resolve(true);
}

beforeAll(async () => {
    await page.goto("http://localhost:8080/play.html");
    await page.exposeFunction("_puppeteerGetSpeedup", () => { return speedup; });
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

test('Confirm 3-letter word yields the score of 1', async () => {
    getResponseMock = getSuccessResponseMock;

    await send_first_n_letters(3);

    const result_eh = await page.waitForSelector('#result', { visible: true });
    await assert_score(result_eh, 1);
}, timeout);

test('Confirm 3-letter and 4-letter words yield the score of 3', async () => {
    getResponseMock = getSuccessResponseMock;

    await send_first_n_letters(3);
    await send_first_n_letters(4);

    const result_eh = await page.waitForSelector('#result', { visible: true });

    await assert_score(result_eh, 3);
}, timeout);

test('Confirm 3- and 4-letter failed words and 5- and 6-letter recoverably failed word yield the score of 0; confirm consequent successful resolution of recoverably failed words updates the score correctly', async () => {
    getResponseMock = getFailureResponseMock;

    await send_first_n_letters(3);
    await send_first_n_letters(4);

    await page.waitForSelector('.failure ~ .failure');

    getResponseMock = getRecoverableFailureResponseMock;

    await send_first_n_letters(5);
    await send_first_n_letters(6);

    const result_eh = await page.waitForSelector('#result', { visible: true });

    await assert_score(result_eh, 0);

    const disclaimer_eh = await page.waitForSelector('#network-issues-disclaimer', { visible: true });
    expect(disclaimer_eh).toBeDefined();

    getResponseMock = getSuccessResponseMock;

    const resend_btn_eh = await page.waitForSelector('#resend', { visible: true });
    expect(resend_btn_eh).toBeDefined();
    await resend_btn_eh!.click();

    await page.waitForSelector('#result:not(.pending-result)');

    await assert_score(result_eh, 7);
}, timeout);

test('Confirm pending word yields pending result, and the result is updated afterwards', async () => {
    getResponseMock = getSuccessResponseMock;

    await send_first_n_letters(3);

    response_timeout = 1250;

    const pending_word = send_first_n_letters(4);

    const result_eh = await page.waitForSelector('.pending-result', { visible: true });
    await expect(result_eh).toBeDefined();

    const result_text = await getPropertyUnsafe(result_eh!, 'textContent');
    expect(result_text).toBeDefined();

    const match_number = /\d+$/g;
    const results = result_text!.match(match_number);
    expect(results).toBeNull();

    await pending_word;
    const result_eh_resolved = await page.waitForSelector('#result:not(.pending-result)');
    await assert_score(result_eh_resolved, 3);
}, timeout);

