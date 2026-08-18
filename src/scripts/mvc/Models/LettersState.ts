import { LanguageCode, LanguageConfig, generate } from '../../generate-letters.js';

export { LanguageConfig };

export interface LettersState {
    letters: string;
    pool: number[];
    buffer: { letterCode: number, cellIndex: number | undefined }[];
    config: LanguageConfig;
}

/**
 * Generates 16 random letters for the game grid.
 */
export function generateLetters(lang: LanguageCode): LettersState {
    const generated = generate(lang);
    return { letters: generated.letters.join(''), pool: generated.alpha_count, buffer: [], config: generated.config };
}
