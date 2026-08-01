/**
 * @jest-environment puppeteer
 */

import { ElementHandle, HTTPRequest } from 'puppeteer';

const timeout = 10000;

async function getTextContent(eh: ElementHandle): Promise<string> {
    return (await eh.evaluate(domElem => domElem.textContent))!;
};

/**
 * Simulates a successful Wiktionary response (word is categorized).
 * @param word The word being queried.
 */
const getSuccessResponseMock = (word: string | undefined) => {
    return {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        // We simulate a successful parse result containing categories
        body: JSON.stringify({
            parse: {
                title: word || 'mock_word',
                categories: [
                    { sortkey: 'example', category: 'English_nouns' } // Simulating a target POS match
                ]
            }
        })
    };
};

/**
 * Simulates a "no definition" response (word exists but is not in a target language/POS, or no categories found).
 */
const getFailureResponseMock = (word: string | undefined) => {
    return {
        status: 200, // Status is OK, but the content indicates failure to match criteria
        headers: { "Access-Control-Allow-Origin": "*" },
        // We simulate a parse result with no relevant categories
        body: JSON.stringify({
            parse: {
                title: word || 'mock_word',
                categories: [] 
            }
        })
    };
};

/**
 * Simulates a network/server error (e.g., rate limiting, server down).
 */
const getRecoverableFailureResponseMock = (word: string | undefined) => {
    return {
        status: 400, // HTTP status code indicating temporary failure
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: 'Temporary server issue' })
    };
};

let getResponseMock = getSuccessResponseMock;

const handler = (request: HTTPRequest) => {
    const url = request.url();
    if (url.includes('wiktionary.org')) {
        // For now we don't really care about the actual word to be parsed out from the URL
        const placeholderWord = "mocked_word"; 
        request.respond(getResponseMock(placeholderWord));
    } else request.continue();
};

const send_first_n_letters = async (n: number): Promise<string> => {
    const letters = await page.$$('.cell');
    let counter = 0;
    let word = '';
    for (const letter of letters) {
        await letter.click();
        word += await getTextContent(letter);
        counter++;
        if (counter == n) break;
    }
    const send = (await page.$('#publish'))!;
    return send.click()
        .then(() => {
            return page.waitForSelector('.pending-score', { timeout: 200 });
        })
        .then((pending_word) => {
            if (pending_word) return getTextContent(pending_word);
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

test('Confirm words are published in the reversed order, and that successfully resolved words have respective class', async () => {
    getResponseMock = getSuccessResponseMock;

    const first_word = (await send_first_n_letters(3))!;

    const first_word_eh = (await page.waitForSelector('.success'))!;
    const published_first_word = await getTextContent(first_word_eh);
    expect(published_first_word).toBe(first_word);

    const second_word = (await send_first_n_letters(4))!;

    const moved_first_word_eh = (await page.waitForSelector('.success ~ .success'))!;
    const moved_published_first_word = await getTextContent(moved_first_word_eh);
    expect(moved_published_first_word).toBe(first_word);

    const second_word_eh = (await page.$('.success'))!;
    const published_second_word = await getTextContent(second_word_eh);
    expect(published_second_word).toBe(second_word);
}, timeout);

test('Confirm failed word has respective class', async () => {
    getResponseMock = getFailureResponseMock;

    const first_word = (await send_first_n_letters(3))!;

    const first_word_eh = (await page.waitForSelector('.failure'))!;
    const published_first_word = await getTextContent(first_word_eh);
    expect(published_first_word).toBe(first_word);
}, timeout);

test('Confirm recoverably failed words have respective class, their occurrence yields network issues disclaimer to appear, and its successful resending yields class modification', async () => {
    getResponseMock = getRecoverableFailureResponseMock;

    const first_word = (await send_first_n_letters(3))!;

    const first_word_eh = (await page.waitForSelector('.network-failure'))!;
    const published_first_word = await getTextContent(first_word_eh);
    expect(published_first_word).toBe(first_word);

    const second_word = (await send_first_n_letters(4))!;

    const moved_first_word_eh = (await page.waitForSelector('.network-failure ~ .network-failure'))!;
    const moved_published_first_word = await getTextContent(moved_first_word_eh);
    expect(moved_published_first_word).toBe(first_word);

    const second_word_eh = (await page.$('.network-failure'))!;
    const published_second_word = await getTextContent(second_word_eh);
    expect(published_second_word).toBe(second_word);

    const disclaimer_eh = await page.waitForSelector('#network-issues-disclaimer', { visible: true, timeout: 10000 });
    expect(disclaimer_eh).toBeDefined();

    getResponseMock = getSuccessResponseMock;

    const resend_btn_eh = await page.waitForSelector('#resend', { visible: true, timeout: 10000 });
    expect(resend_btn_eh).toBeDefined();
    await resend_btn_eh!.click();

    const validated_word_eh = await page.waitForSelector('.success ~ .success');
    expect(validated_word_eh).toBeDefined();
    const published_validated_word = await getTextContent(validated_word_eh!);
    expect(published_validated_word).toBe(first_word);

    const validated_words = await page.$$('.success');
    expect(validated_words).toBeDefined();
    expect(validated_words.length).toBe(2);

    const failed_words = await page.$$('.network-failure');
    expect(failed_words).toBeDefined();
    expect(failed_words.length).toBe(0);

    const disclaimer_box_model = await disclaimer_eh!.boxModel();
    expect(disclaimer_box_model).toBeNull();
}, timeout);
