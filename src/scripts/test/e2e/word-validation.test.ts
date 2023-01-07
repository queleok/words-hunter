import { JSHandle, ElementHandle, HTTPRequest } from 'puppeteer';

const timeout = 10000;

async function getTextContent(eh: ElementHandle): Promise<string> {
    return (await eh.evaluate(domElem => domElem.textContent))!;
};

beforeAll(async () => {
    await page.goto("http://localhost:8080/play.html");
});

test('Ensure validated words are added correctly', async () => {
    await page.setRequestInterception(true);

    const success_handler = (request: HTTPRequest)  => {
        if (request.url().startsWith('https://api.dictionaryapi.dev/api/v2/entries/en/')) {
            const word = request.url().split('/').pop();
            request.respond({
                status: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                contentType: 'application/json',
                body: `[{ "word": "${word}", "meanings": [ { "partOfSpeech": "stub", "definitions": [ { "definition": "stub" } ]}]}]`
            });
        } else request.continue();
    };
    page.on('request', success_handler);

    const letters = await page.$$('.cell');

    const send_first_n_letters = async (n: number): Promise<string> => {
        let counter = 0;
        let word = '';
        for (const letter of letters) {
            await letter.click();
            word += await getTextContent(letter);
            counter++;
            if (counter == n) break;
        }
        const send = await page.$('#publish');
        await send!.click();

        return word;
    };

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

    page.off('request', success_handler);

    await page.setRequestInterception(false);
}, timeout);

test('Ensure failed words are added correctly', async () => {
    await page.reload();
    await page.setRequestInterception(true);
    const failure_handler = (request: HTTPRequest) => {
        if (request.url().startsWith('https://api.dictionaryapi.dev/api/v2/entries/en/')) {
            const word = request.url().split('/').pop();
            request.respond({
                status: 404,
                headers: { "Access-Control-Allow-Origin": "*" },
                contentType: 'application/json',
                body: `[ "Word '${word}' not found" ]`
            });
        } else request.continue();
    };
    page.on('request', failure_handler);

    const letters = await page.$$('.cell');

    const send_first_n_letters = async (n: number): Promise<string> => {
        let counter = 0;
        let word = '';
        for (const letter of letters) {
            await letter.click();
            word += await getTextContent(letter);
            counter++;
            if (counter == n) break;
        }
        const send = await page.$('#publish');
        await send!.click();

        return word;
    };

    const first_word = (await send_first_n_letters(3))!;

    const first_word_eh = (await page.waitForSelector('.failure'))!;
    const published_first_word = await getTextContent(first_word_eh);
    expect(published_first_word).toBe(first_word);

    const second_word = (await send_first_n_letters(4))!;

    const moved_first_word_eh = (await page.waitForSelector('.failure ~ .failure'))!;
    const moved_published_first_word = await getTextContent(moved_first_word_eh);
    expect(moved_published_first_word).toBe(first_word);

    const second_word_eh = (await page.$('.failure'))!;
    const published_second_word = await getTextContent(second_word_eh);
    expect(published_second_word).toBe(second_word);

    page.off('request', failure_handler);

    await page.setRequestInterception(false);
}, timeout);
