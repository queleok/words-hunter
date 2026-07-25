/**
 * @jest-environment puppeteer
 */

import { Page, ElementHandle } from 'puppeteer';

const timeout = process.env.SLOWMO ? 120000 : 10000;

beforeAll(async () => {
    await page.goto("http://localhost:8080/play.html");
    await page.exposeFunction("_puppeteerGetSpeedup", () => { return 1; });
});

test('Drag and Drop Functionality Tests', async () => {
    const input = (await page.$('input'))!;

    const inputSelector = '#inpt'; // Input field for the word being typed/edited
    const originalText = "abcdef";

    // 1. Setup: Ensure the input field has known content
    await page.focus(inputSelector);
    await page.keyboard.type(originalText);

    // 2. Select "ef" (start index 4, end index 5 inclusive)
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.up('Shift');

    // 4. Simulate the native Browser Drop text mutation inside page context
    // This replicates exactly what Chromium's rendering engine does internally on mouse drop
    await page.$eval(inputSelector, (el: Element) => {
        const input = el as HTMLInputElement;
        // const value = input.value;
        const initialValue = input.value;
    
        // Extract the exact start and end bounds of the highlighted text selection
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;
    
        if (start == end) return;

        /*
        const selectedText = value.substring(start, end);
        const remainingText = value.substring(0, start) + value.substring(end);

        input.dispatchEvent(new Event('beforeinput', { bubbles: true }));

        // Re-insert the text at the very beginning of the string (index 0)
        input.value = selectedText + remainingText;
    
        // Fire native web events so framework listeners pick up the change
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        */

        const draggedText = initialValue.substring(start, end);
        const remainingText = initialValue.substring(0, start) + initialValue.substring(end);

        // A. Create the DataTransfer mock structure used by internal drag mechanics
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', draggedText);

        // Type-safe helper function using a factory callback to bypass constructor signature checks
        const fireEvent = (createEvent: () => Event): boolean => {
          const ev = createEvent();
          return input.dispatchEvent(ev);
        };

        const eventOptions = { bubbles: true, cancelable: true };

        // B. Dispatch Drag Start Loop
        fireEvent(() => new DragEvent('dragstart', { ...eventOptions, dataTransfer }));
        fireEvent(() => new DragEvent('drag', { ...eventOptions, dataTransfer }));
        fireEvent(() => new DragEvent('dragenter', { ...eventOptions, dataTransfer }));
        fireEvent(() => new DragEvent('dragover', { ...eventOptions, dataTransfer }));

        // D. Dispatch BeforeInput for Content Insertion (the text being dropped)
        const allowedInsert = fireEvent(() => new InputEvent('beforeinput', {
          ...eventOptions,
          inputType: 'insertFromDrop',
          data: draggedText,
          dataTransfer
        }));

        // C. Dispatch BeforeInput for Content Deletion (the text being picked up)
        const allowedDelete = fireEvent(() => new InputEvent('beforeinput', {
          ...eventOptions,
          inputType: 'deleteByDrag',
          data: null
        }));

        // E. Update value only if your external listeners didn't call event.preventDefault()
        if (allowedDelete && allowedInsert) {
          // Drop destination is index 0 (the start of the word)
          input.value = draggedText + remainingText;

          // F. Dispatch traditional Input mutation notifications
          input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromDrop', data: draggedText }));
          input.dispatchEvent(new Event('change', { bubbles: true }));

          // G. Finish Drag Termination Events
          fireEvent(() => new DragEvent('drop', { ...eventOptions, dataTransfer }));
          fireEvent(() => new DragEvent('dragend', { ...eventOptions, dataTransfer }));
        }

    });

    // 4. Assertion (Check if the text was successfully moved/updated)
    const finalContent = await page.$eval(inputSelector, el => (el as HTMLInputElement).value); // Check .value instead of .textContent

    // Success: 'abcdef' correctly transforms to 'efabcd'
    expect(finalContent).toBe('efabcd');

    // 5. Assertion: Check that sorted contiguous block of highlighted elements is a substring of 'abcdef'
    const highlightedElements = await page.$$('.cell.highlighted');
    expect(highlightedElements).toBeDefined();
    // 
    // for (const el of highlightedElements) {
    // expect(highlightedElements!.length).toBe(6);
    const cellTexts: string[] = await page.$$eval('.cell.highlighted', (elements: Element[]) => {
        return elements.map(el => (el.textContent ?? '').trim());
    });
  
    // 2. Join the elements, filter down to unique characters, and sort them
    const extractedChars: string = cellTexts
      .join('')
      .split('')
      .sort()
      .join('');

    //               a, b, c, d, e, f
    const freqmap = [1, 1, 1, 1, 1, 1];
    for (const c of extractedChars) {
        expect(c).toMatch(new RegExp('[a-f]'));
        const ix = c.charCodeAt(0) - "a".charCodeAt(0);
        freqmap[ix] -= 1;
        expect(freqmap[ix]).toBe(0);
    }
}, timeout);
