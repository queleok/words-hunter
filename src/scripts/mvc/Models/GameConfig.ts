import { LanguageCode } from './LanguageState.js';

export interface GameConfig {
    language: LanguageCode;
    validatorType: 'dictionary' | 'wiktionary';
    timeLimitMinutes: number;
}

const ENGLISH_CONFIG: GameConfig = {
    language: 'en',
    validatorType: 'wiktionary',
    timeLimitMinutes: 2,
};

const SWEDISH_CONFIG: GameConfig = {
    language: 'sv',
    validatorType: 'wiktionary',
    timeLimitMinutes: 2,
};

export function createConfig(language: LanguageCode = 'en', validatorType: 'dictionary' | 'wiktionary' = 'wiktionary'): GameConfig {
    const base = language === 'sv' ? SWEDISH_CONFIG : ENGLISH_CONFIG;
    return { ...base, validatorType };
}

