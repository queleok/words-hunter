import { limits, generate, shuffle, getLetterOrdinalNumber } from "../generate-letters"

test("atoix", () => {
    let alphabet = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 26; ++i) expect(getLetterOrdinalNumber(alphabet.charAt(i))).toBe(i);
    for (let i = 0; i < 26; ++i) expect(getLetterOrdinalNumber(alphabet.charAt(i).toUpperCase())).toBe(i);
});

test("generate", () => {
    let prev_letters = new Array<string>();
    for (let i = 0; i < 100; ++i) {
        let { alpha_count, letters } = generate();

        expect(letters.length).toEqual(16);
        expect(alpha_count.length).toEqual(26);

        for (let j = 0; j < alpha_count.length; ++j) {
            expect(alpha_count[j]).toBeLessThanOrEqual(limits[j]);
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
