export interface ValidationResult {
    word: string;
    status: 'valid' | 'invalid' | 'stale';
}
