import { generate, shuffle, getLetterOrdinalNumber } from "../generate-letters"

test("atoix", () => {
    let alphabet = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 26; ++i) expect(getLetterOrdinalNumber(alphabet.charAt(i))).toBe(i);
    for (let i = 0; i < 26; ++i) expect(getLetterOrdinalNumber(alphabet.charAt(i).toUpperCase())).toBe(i);
});

test("generate", () => {
    let prev_letters = new Array<string>();
    for (let i = 0; i < 100; ++i) {
        let { alpha_count, letters, config } = generate('en');

        expect(letters.length).toEqual(16);
        expect(alpha_count.length).toEqual(26);

        for (let j = 0; j < config.limits.length; ++j) {
            expect(alpha_count[j]).toBeLessThanOrEqual(config.limits[j]);
        }

        expect(letters).not.toEqual(prev_letters);
        prev_letters = [...letters];
    }
});

test("shuffle", () => {
    let letters = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p' ];
    let shuffled_letters = [...letters];
    for (let i = 0; i < 10; ++i) {
        shuffle(shuffled_letters);
        expect(shuffled_letters).not.toEqual(letters);
        expect(shuffled_letters.sort()).toEqual(letters);
    }
});

test("sv_ordinal", () => {
    // Test characters specific to Swedish alphabet
    expect(getLetterOrdinalNumber('å', 'sv')).toBe(26); // a-z are 0-25, å is 26
    expect(getLetterOrdinalNumber('ä', 'sv')).toBe(27); // ä is 27
    expect(getLetterOrdinalNumber('ö', 'sv')).toBe(28); // ö is 28

    // Test standard characters using Swedish config
    expect(getLetterOrdinalNumber('a', 'sv')).toBe(0);
    expect(getLetterOrdinalNumber('z', 'sv')).toBe(25);
});

test("sv_generation", () => {
    const { alpha_count, letters, config } = generate('sv');

    // 1. Alphabet Size Check: Swedish alphabet is 29 characters long ('abcdefghijklmnopqrstuvwxyzåäö')
    expect(config.alphabet.length).toEqual(29);

    // 2. Letter Count Check: Generation always produces 16 letters in this implementation
    expect(letters.length).toEqual(16);

    // 3. Limit Enforcement Check: Ensure no character count exceeds its limit
    const limits = config.limits;

    for (let i = 0; i < config.alphabet.length; ++i) {
        expect(alpha_count[i]).toBeLessThanOrEqual(limits[i]);
    }
});
