/**
 * @jest-environment puppeteer
 */

import { ElementHandle, HTTPRequest } from 'puppeteer';

const timeout = 10000;

beforeAll(async () => {
    await page.goto("http://localhost:8080/play.html");
    await page.exposeFunction("_puppeteerGetSpeedup", () => { return 100; });
});

test('Pressing an unhighlighted button does not change state when input is full (16 symbols)', async () => {
    
    const maxInputLength = 16;
    // 1. Setup: Fill input with exactly 16 letters using direct typing simulation.
    // const wordBase = 'abcdefghijklmnop'; 
    const wordBase = 'aaaaaaaaaaaaaaaa'; 

    await page.keyboard.type(wordBase);

    // Check initial length
    let initialLengthText = await page.evaluate(() => document.querySelector('input')?.value || '');
    // We need to assert that the input actually holds 16 characters before proceeding
    expect(initialLengthText.length).toBe(maxInputLength);

    // 2. Action: Identify and press one of the unhighlighted buttons (e.g., cell index 0).
    const lettersHandles = await page.$$('.cell:not(.highlighted)');

    if (!lettersHandles || lettersHandles.length === 0) {
        throw new Error("No letter cells found on the page for state checking.");
    }

    // Aggressively casting the target element to prevent TS errors
    const targetCellEl = lettersHandles[0]; 
    await targetCellEl.click();

    // 3. Assert: Check for state changes (highlighting and input growth)
    let finalLengthText = await page.evaluate(() => document.querySelector('input')?.value || '');

    // Assertion 1: Input must not grow past max length
    expect(finalLengthText.length).toBe(maxInputLength); 

    // Assertion 2: The target cell should *not* be highlighted by the game logic if input is full.
    const wasHighlighted = await targetCellEl.evaluate(cellEl => {
        return (cellEl)?.classList?.contains('highlighted') ?? false;
    });

    expect(wasHighlighted).toBe(false); 
});

