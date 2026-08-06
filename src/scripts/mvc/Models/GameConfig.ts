import { LanguageCode } from '../../generate-letters.js';

export { LanguageCode}

export interface GameConfig {
    language: LanguageCode;
    validatorType: 'dictionary' | 'wiktionary';
    timeLimitMinutes: number;
    alphabet: string;
    frequencies: number[];
    limits: number[];
    vowels: string;
}

const ENGLISH_CONFIG: GameConfig = {
    language: 'en',
    validatorType: 'dictionary',
    timeLimitMinutes: 2,
    alphabet: 'abcdefghijklmnopqrstuvwxyz',
    frequencies: [8.12, 1.49, 2.71, 4.32, 12.02, 2.3, 2.03, 5.92, 7.31, 0.1, 0.69, 3.98, 2.61, 6.95, 7.68, 1.82, 0.11, 6.02, 6.28, 9.1, 2.88, 1.11, 2.09, 0.17, 2.11, 0.07],
    limits: [3, 2, 2, 2, 3, 2, 2, 2, 3, 1, 2, 3, 2, 3, 3, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2],
    vowels: 'ieaouy'
};

const SWEDISH_CONFIG: GameConfig = {
    language: 'sv',
    validatorType: 'wiktionary',
    timeLimitMinutes: 2,
    alphabet: 'abcdefghijklmnopqrstuvwxyzåäö',
    frequencies: [9.0, 1.3, 1.2, 4.8, 10.1, 1.9, 3.0, 1.9, 6.2, 0.6, 3.4, 5.0, 3.4, 8.6, 4.4, 1.8, 0.01, 8.7, 6.9, 8.2, 1.8, 2.5, 0.1, 0.1, 0.5, 0.01, 1.3, 1.7, 1.5],
    limits: [3, 2, 2, 2, 3, 2, 3, 2, 3, 2, 2, 3, 2, 4, 3, 3, 1, 3, 3, 3, 2, 2, 2, 1, 2, 2, 2, 2],
    vowels: 'eaiouäöåy'
};

export function createConfig(language: LanguageCode = 'en', validatorType: 'dictionary' | 'wiktionary' = 'wiktionary'): GameConfig {
    const base = language === 'sv' ? SWEDISH_CONFIG : ENGLISH_CONFIG;
    return { ...base, validatorType };
}

export function createDefaultConfig(): GameConfig {
    return createConfig('en', 'dictionary');
}

export function createSwedishConfig(): GameConfig {
    return createConfig('sv', 'wiktionary');
}
