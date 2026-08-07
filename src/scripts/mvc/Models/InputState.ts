export interface InputState {
    text: string;
}

export function createInputState(): InputState {
    return { text: '' };
}
