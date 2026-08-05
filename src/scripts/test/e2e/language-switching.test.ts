/**
 * @jest-environment puppeteer
 */

import { ElementHandle } from 'puppeteer';

const timeout = 10000;

async function getTextContent(eh: ElementHandle): Promise<string> {
    return (await eh.evaluate(domElem => domElem.textContent))!;
};

/**
 * Simulates a successful Wiktionary response.
 */
const getSuccessResponseMock = () => ({
    status: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
        parse: {
            title: 'mock_word',
            categories: [{ sortkey: 'example', category: 'English_nouns' }]
        }
    })
});

/**
 * Simulates a failure response.
 */
const getFailureResponseMock = () => ({
    status: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
        parse: {
            title: 'mock_word',
            categories: []
        }
    })
});

/**
 * Simulates a recoverable network failure.
 */
const getRecoverableFailureResponseMock = () => ({
    status: 400,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ error: 'Temporary server issue' })
});

let getResponseMock = getSuccessResponseMock;

const handler = (request: any) => {
    const url = request.url();
    if (url.includes('wiktionary.org')) {
        request.respond(getResponseMock());
    } else {
        request.continue();
    }
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

test('Swedish language selection persists to localStorage', async () => {
    const selector = (await page.$('#language-selector'))!;
    await selector.selectOption({ value: 'sv' });

    const storedLanguage = await page.evaluate(() => localStorage.getItem('selectedLanguage'));
    expect(storedLanguage).toBe('sv');
});

test('English language selection persists to localStorage', async () => {
    const selector = (await page.$('#language-selector'))!;
    await selector.selectOption({ value: 'en' });

    const storedLanguage = await page.evaluate(() => localStorage.getItem('selectedLanguage'));
    expect(storedLanguage).toBe('en');
});

test('Language is restored from localStorage on reload', async () => {
    // Select Swedish first, then reload to verify it's remembered
    const selector = (await page.$('#language-selector'))!;
    await selector.selectOption({ value: 'sv' });

    const storedLanguage = await page.evaluate(() => localStorage.getItem('selectedLanguage'));
    expect(storedLanguage).toBe('sv');

    // Reload the page
    await page.reload();

    // Verify the language selector shows Swedish as selected
    const currentLanguage = await page.evaluate(() => {
        return document.getElementById('language-selector')?.value;
    });
    expect(currentLanguage).toBe('sv');
});

test('Swedish characters åäö can be typed and highlighted', async () => {
    // Select Swedish language first
    const selector = (await page.$('#language-selector'))!;
    await selector.selectOption({ value: 'sv' });

    // Wait for the game to reset after language change
    await page.waitForSelector('.hidden');

    // Type a Swedish word containing åäö characters
    const input = (await page.$('#inpt'))!;
    await input.type('åäö', { delay: 50 });

    // Verify the characters appear in the letter widgets
    const letters_div = (await page.$('#letters'))!;
    const cells = await letters_div.$$('.cell');
    let found_count = 0;
    for (const cell of cells) {
        const text = await getTextContent(cell);
        if (['å', 'ä', 'ö'].includes(text)) {
            found_count++;
        }
    }

    // At least some of the Swedish characters should appear in letter widgets
    expect(found_count).toBeGreaterThan(0);
});

test('Swedish word can be published successfully after language switch', async () => {
    // Select Swedish and wait for reset
    const selector = (await page.$('#language-selector'))!;
    await selector.selectOption({ value: 'sv' });
    await page.waitForSelector('.hidden');

    // Type a simple word that should be valid in Swedish context
    const input = (await page.$('#inpt'))!;
    await input.type('test', { delay: 50 });

    // Click publish button
    const publish_btn = (await page.$('#publish'))!;
    await publish_btn.click();

    // Wait for the word to be processed
    await page.waitForSelector('.score');

    // Verify the published word appears in scores area
    const scores = (await page.$('#scores'))!;
    const score_elements = await scores.$$('.score');
    expect(score_elements.length).toBeGreaterThan(0);
});

test('English mode does not accept Swedish-specific characters', async () => {
    // Ensure English is selected
    const selector = (await page.$('#language-selector'))!;
    await selector.selectOption({ value: 'en' });

    // Wait for reset
    await page.waitForSelector('.hidden');

    // Try to type a Swedish character
    const input = (await page.$('#inpt'))!;
    await input.type('å', { delay: 50 });

    // The character should not be highlighted in the letter widgets
    const letters_div = (await page.$('#letters'))!;
    const cells = await letters_div.$$('.cell');
    let found_swedish_chars = 0;
    for (const cell of cells) {
        const text = await getTextContent(cell);
        if (['å', 'ä', 'ö'].includes(text)) {
            found_swedish_chars++;
        }
    }

    // Swedish characters should not appear in letter widgets when English is selected
    expect(found_swedish_chars).toBe(0);
});

test('Swedish-specific letters are available after switching to Swedish', async () => {
    const selector = (await page.$('#language-selector'))!;
    await selector.selectOption({ value: 'sv' });
    await page.waitForSelector('.hidden');

    // Verify that the letter widgets contain Swedish characters
    const letters_div = (await page.$('#letters'))!;
    const cells = await letters_div.$$('.cell');
    let has_swedish_chars = false;
    for (const cell of cells) {
        const text = await getTextContent(cell);
        if (['å', 'ä', 'ö'].includes(text)) {
            has_swedish_chars = true;
            break;
        }
    }

    expect(has_swedish_chars).toBe(true);
});

test('Language switch resets the game state properly', async () => {
    // Select Swedish and wait for reset
    const selector = (await page.$('#language-selector'))!;
    await selector.selectOption({ value: 'sv' });
    await page.waitForSelector('.hidden');

    // Verify timer is running again after language switch
    const timeleft = (await page.$('#timeleft'))!;
    const time_text = await getTextContent(timeleft);
    expect(time_text).toBeTruthy();
});

test('Switching back to English clears Swedish-specific state', async () => {
    // First select Swedish and wait for reset
    const selector = (await page.$('#language-selector'))!;
    await selector.selectOption({ value: 'sv' });
    await page.waitForSelector('.hidden');

    // Verify Swedish characters are available
    const letters_div = (await page.$('#letters'))!;
    let swedish_chars_visible = false;
    for (const cell of await letters_div.$$('.cell')) {
        if (['å', 'ä', 'ö'].includes(await getTextContent(cell))) {
            swedish_chars_visible = true;
            break;
        }
    }
    expect(swedish_chars_visible).toBe(true);

    // Now switch back to English and wait for reset
    await selector.selectOption({ value: 'en' });
    await page.waitForSelector('.hidden');

    // Verify Swedish characters are no longer available
    swedish_chars_visible = false;
    for (const cell of await letters_div.$$('.cell')) {
        if (['å', 'ä', 'ö'].includes(await getTextContent(cell))) {
            swedish_chars_visible = true;
            break;
        }
    }

    expect(swedish_chars_visible).toBe(false);
});
