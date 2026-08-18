export interface InputState {
    text: string;
    allowed: string;
}

export function createInputState(): InputState {
    return { text: '', allowed: 'abcdefghijklmnopqrstuvwxyz' };
}
