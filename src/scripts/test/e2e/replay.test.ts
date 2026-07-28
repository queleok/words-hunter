/**
 * @jest-environment puppeteer
 */

import { ElementHandle, HTTPRequest } from 'puppeteer';

beforeAll(async () => {
    await page.goto("http://localhost:8080/play.html");
    await page.exposeFunction("_puppeteerGetSpeedup", () => { return 100; });
});

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

test('Replay functionality generates different results than the original run', async () => {
    await page.waitForSelector('#letters');
    let originalGridContent = await getGridContent();

    await page.click('#again');

    // Wait for the new results to appear and update
    await page.waitForSelector('#letters');

    let replayedGridContent = await getGridContent();

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
