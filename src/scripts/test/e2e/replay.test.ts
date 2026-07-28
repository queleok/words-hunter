/**
 * @jest-environment puppeteer
 */

import { ElementHandle, HTTPRequest } from 'puppeteer';

async function getTextContent(eh: ElementHandle): Promise<string> {
    return (await eh.evaluate(domElem => domElem.textContent))!;
};

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

// Helper function to get the concatenated content of all letter cells in the grid
async function getGridContent(): Promise<string> {
    return page.evaluate(() => {
        const cells = document.querySelectorAll('#letters .cell');
        let content = '';
        cells.forEach(cell => {
            content += cell.textContent || '';
        });
        return content;
    });
}

beforeEach(async () => {
    await page.reload();
    await page.setRequestInterception(true);
    page.on('request', handler);
});

afterEach(async () => {
    page.off('request', handler);
    await page.setRequestInterception(false);
});

beforeAll(async () => {
    await page.goto("http://localhost:8080/play.html");
    await page.exposeFunction("_puppeteerGetSpeedup", () => { return 1; });
});

test('Replay functionality generates different results than the original run', async () => {
    await page.waitForSelector('#letters');
    const originalGridContent = await getGridContent();

    await page.focus('#inpt');
    await page.keyboard.type(originalGridContent);
    await page.click('#publish')
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
            expect(resolved_word).toBe(originalGridContent);
        });

    await page.click('#again');

    // Wait for the new results to appear and update
    await page.waitForSelector('#letters');

    // Assertion 1: Check if the result element is hidden (reset state)
    const resultsElement = await page.$('#result');
    expect(resultsElement).toBeTruthy();
    const areResultsHidden = await page.evaluate(el => el.classList.contains('hidden'), resultsElement!);
    expect(areResultsHidden).toBeTruthy();

    // Assertion 2: Check if the word input field is cleared
    const inputField = await page.$('input');
    expect(inputField).toBeTruthy();
    const inputText = await page.evaluate(el => el.value, inputField!);
    expect(inputText).toBe('');

    // Assertion 3: Check if the timer is reset to "02:00"
    const timeleftElement = await page.$('#timeleft');
    expect(timeleftElement).toBeTruthy();
    const timerText = await page.evaluate(el => el.textContent || '', timeleftElement!);
    expect(timerText).toBe("02:00");

    // Assertion 4 & 5: Check if all previous scores have been removed (scores container is empty)
    const scoresContainer = await page.$('#scores');
    expect(scoresContainer).toBeTruthy();
    const scoresCount = await page.evaluate(el => el.children.length, scoresContainer!);
    expect(scoresCount).toBe(0);

    const replayedGridContent = await getGridContent();

    // Assertion: The new result must be different from the original one
    expect(replayedGridContent).not.toEqual(originalGridContent);
});

test('Replaying multiple times ensures continuous variation', async () => {
    // Assume initial grid is generated
    await page.waitForSelector('#letters');
    let firstGridContent = await getGridContent();

    // Replay 3 times
    for (let i = 0; i < 3; i++) {
        console.log(`Replay iteration ${i + 1}...`);
        await page.click('#again'); // Changed from #replay-button to #again
        await page.waitForSelector('#letters');
        const currentGridContent = await getGridContent();
        
        // Check that the current value is different from the previous one
        expect(currentGridContent).not.toEqual(firstGridContent);
        firstGridContent = currentGridContent; // Update baseline for next iteration
    }
});
