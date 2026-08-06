import { GameConfig } from './GameConfig.js';

export interface GameState {
    wordBuffer: string;
    publishedWords: PublishedWord[];
    timerSeconds: number;
    isRunning: boolean;
    shuffled: boolean;
}

export interface PublishedWord {
    text: string;
    id: string;
    isValidated: boolean;
    fetchResult?: 'success' | 'validation-failure' | 'no-definition' | 'network-failure';
}

export function createInitialState(config: GameConfig): GameState {
    return {
        wordBuffer: '',
        publishedWords: [],
        timerSeconds: config.timeLimitMinutes * 60,
        isRunning: true,
        shuffled: false
    };
}

export function resetState(state: GameState): GameState {
    return {
        ...state,
        wordBuffer: '',
        publishedWords: [],
        timerSeconds: state.isRunning ? state.timerSeconds : 0,
        isRunning: true,
        shuffled: false
    };
}

export function stopState(state: GameState): GameState {
    return {
        ...state,
        isRunning: false
    };
}
