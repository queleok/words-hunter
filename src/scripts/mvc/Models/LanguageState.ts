import { LanguageCode } from '../../generate-letters.js';

export { LanguageCode }

export interface LanguageState {
    code: LanguageCode;
    name: string;
    alphabet: string;
}

function createEnglishState(): LanguageState {
    return { code: 'en', name: 'English', alphabet: 'abcdefghijklmnopqrstuvwxyz' };
}

function createSwedishState(): LanguageState {
    return { code: 'sv', name: 'Swedish', alphabet: 'abcdefghijklmnopqrstuvwxyzåäö' };
}

export function createLanguageState(code: LanguageCode): LanguageState {
    return (code === 'en' ? createEnglishState() : createSwedishState());
}
