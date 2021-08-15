import { ElementHandle } from 'puppeteer';

const timeout = 10000;

async function getPropertyUnsafe(eh: ElementHandle, property: string): Promise<string> {
    return await (await eh.getProperty(property))!.jsonValue();
}

beforeAll(async () => {
    await page.goto("http://localhost:8080/play.html");
});

test('Ensure validated words are added correctly', async () => {
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.url().startsWith('https://api.dictionaryapi.dev/api/v2/entries/en/')) {
            const word = request.url().split('/').pop();
            request.respond({
                status: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                contentType: 'application/json',
                body: `[{ "word": "${word}", "meanings": [ { "partOfSpeech": "stub", "definitions": [ { "definition": "stub" } ]}]}]`
            });
        } else request.continue();
    });

    const letters = await page.$$('.cell');

    const send_first_n_letters = async (n: number): Promise<string> => {
        let counter = 0;
        let word = '';
        for (const letter of letters) {
            await letter.click();
            word += await getPropertyUnsafe(letter, 'textContent');
            counter++;
            if (counter == n) break;
        }
        const send = await page.$('#publish');
        await send!.click();

        return word;
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
