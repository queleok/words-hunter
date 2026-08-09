import { LanguageCode, LanguageConfig, generate } from '../../generate-letters.js';

export { LanguageConfig };

export interface LetterData {
    letter: string;
    frequency: number;
    limit: number;
}

export interface LettersState {
    letters: LetterData[];
    buffer: (number | undefined)[];
}

export function createLetterData(letter: string, frequency: number, limit: number): LetterData {
    return { letter, frequency, limit };
}

/**
 * Creates a map of LetterData for all letters in the given alphabet.
 */
export function createLetterMap(alphabet: string, frequencies: number[], limits: number[]): Map<string, LetterData> {
    const map = new Map<string, LetterData>();
    for (let i = 0; i < alphabet.length; i++) {
        map.set(alphabet[i], createLetterData(alphabet[i], frequencies[i], limits[i]));
    }
    return map;
}

/**
 * Creates a letter data map from the given language code.
 */
export function createLetterMapFromConfig(language: LanguageCode): Map<string, LetterData> {
    const config = getLanguageConfig(language);
    return createLetterMap(config.alphabet, config.frequencies, config.limits);
}

export function getLanguageConfig(language: LanguageCode): LanguageConfig {
    if (language === 'sv') {
        return {
            code: 'sv',
            name: 'Swedish',
            alphabet: 'abcdefghijklmnopqrstuvwxyzåäö',
            frequencies: [9.0, 1.3, 1.2, 4.8, 10.1, 1.9, 3.0, 1.9, 6.2, 0.6, 3.4, 5.0, 3.4, 8.6, 4.4, 1.8, 0.01, 8.7, 6.9, 8.2, 1.8, 2.5, 0.1, 0.1, 0.5, 0.01, 1.3, 1.7, 1.5],
            limits: [3, 2, 2, 2, 3, 2, 3, 2, 3, 2, 2, 3, 2, 4, 3, 3, 1, 3, 3, 3, 2, 2, 2, 1, 2, 2, 2, 2],
            vowels: 'aeiouyåäö'
        };
    } else {
        return {
            code: 'en',
            name: 'English',
            alphabet: 'abcdefghijklmnopqrstuvwxyz',
            frequencies: [8.12, 1.49, 2.71, 4.32, 12.02, 2.3, 2.03, 5.92, 7.31, 0.1, 0.69, 3.98, 2.61, 6.95, 7.68, 1.82, 0.11, 6.02, 6.28, 9.1, 2.88, 1.11, 2.09, 0.17, 2.11, 0.07],
            limits: [3, 2, 2, 2, 3, 2, 2, 2, 3, 1, 2, 3, 2, 3, 3, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2],
            vowels: 'aeiouy'
        };
    }
}

/**
 * Generates 16 random letters for the game grid.
 */
export function generateLetters(lang: LanguageCode): LettersState {
    const generated = generate(lang);
    return { letters: generated.letters.map((letter) => {
        const ix = generated.config.alphabet.indexOf(letter);
        return { letter: letter, frequency: generated.config.frequencies[ix], limit: generated.config.limits[ix] };
    }), buffer: []};
}
