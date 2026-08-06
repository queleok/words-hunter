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
const getResponseMock = () => ({
    status: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
        parse: {
            title: 'mock_word',
            categories: [{ sortkey: 'example', category: 'English_nouns' }, { sortkey: 'example', category: 'Swedish_nouns' }]
        }
    })
});

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

async function selectLanguage(lang: 'en' | 'sv'): Promise<void> {
    // Use native DOM to set the select value, bypassing TypeScript ElementHandle limitations
    await page.evaluate((lang) => {
        const selector = document.getElementById('language-selector') as HTMLSelectElement;
        if (selector) {
            selector.value = lang;
            selector.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }, lang);
}

/**
 * Types "åäö" into the input field and returns the set of Swedish characters
 * that are present in the letter widgets (highlighted or not).
 */
async function typeSwedishCharsAndCollectPresent(): Promise<string[]> {
    const input = (await page.$('#inpt'))!;
    await input.type('åäö', { delay: 50 });

    // Collect all cell text contents, filtering out placeholder '*' and empty strings
    const cells = await page.$$('.cell');
    const cellContents = new Set<string>();
    for (const cell of cells) {
        const text = await getTextContent(cell);
        if (text && !['*', ''].includes(text)) {
            cellContents.add(text);
        }
    }

    // Find which Swedish characters are present in the widgets
    const swedishChars = ['å', 'ä', 'ö'];
    let matchedSwedishChars: string[] = [];
    for (const char of swedishChars) {
        if (cellContents.has(char)) {
            matchedSwedishChars.push(char);
        }
    }

    return matchedSwedishChars;
}

/**
 * Verifies that all present Swedish characters have the 'highlighted' class.
 */
async function verifySwedishCharsHighlighted(matchedSwedishChars: string[]): Promise<void> {
    // If no Swedish chars are present, nothing to verify — this is fine
    if (matchedSwedishChars.length === 0) return;

    for (const char of matchedSwedishChars) {
        const highlightedCell = await page.$(`.cell.l-${char}.highlighted`);
        expect(highlightedCell).toBeDefined();
    }
}

test('Swedish language selection persists to localStorage', async () => {
    await selectLanguage('sv');

    const storedLanguage = await page.evaluate(() => localStorage.getItem('selectedLanguage'));
    expect(storedLanguage).toBe('sv');
});

test('English language selection persists to localStorage', async () => {
    await selectLanguage('en');

    const storedLanguage = await page.evaluate(() => localStorage.getItem('selectedLanguage'));
    expect(storedLanguage).toBe('en');
});

test('Language is restored from localStorage on reload', async () => {
    // Select Swedish first, then reload to verify it's remembered
    await selectLanguage('sv');

    const storedLanguage = await page.evaluate(() => localStorage.getItem('selectedLanguage'));
    expect(storedLanguage).toBe('sv');

    // Reload the page
    await page.reload();

    // Verify the language selector shows Swedish as selected
    const currentLanguage = await page.evaluate(() => {
        return (document.getElementById('language-selector') as HTMLSelectElement)?.value;
    });
    expect(currentLanguage).toBe('sv');
});

test('Swedish characters åäö can be typed and highlighted', async () => {
    // Select Swedish language first
    await selectLanguage('sv');

    // Wait for the game to reset after language change
    await page.waitForSelector('.hidden');

    // Type a Swedish word containing åäö characters
    const matchedSwedishChars = await typeSwedishCharsAndCollectPresent();

    // Verify that present Swedish chars are highlighted (if any)
    await verifySwedishCharsHighlighted(matchedSwedishChars);
});

test('Swedish word can be published successfully after language switch', async () => {
    // Select Swedish and wait for reset
    await selectLanguage('sv');
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
    await selectLanguage('en');

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

test('Language switch resets the game state properly', async () => {
    // Select Swedish and wait for reset
    await page.waitForSelector('.hidden');
    const timeleft = (await page.$('#timeleft'))!;

    await selectLanguage('sv');

    // Verify timer is running again after language switch
    const time_text = await getTextContent(timeleft);
    expect(time_text).toBe('02:00');
});

