export interface InputState {
    text: string;
    indices: number[];
}

export function createInputState(): InputState {
    return { text: '', indices: [] };
}
