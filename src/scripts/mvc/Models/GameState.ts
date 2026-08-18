import { GameConfig } from './GameConfig.js';
import { PublishedWord } from './PublishedWord.js';

export interface GameState {
    wordBuffer: string;
    publishedWords: PublishedWord[];
    timerSeconds: number;
    isRunning: boolean;
}

export function createInitialState(config: GameConfig): GameState {
    return {
        wordBuffer: '',
        publishedWords: [],
        timerSeconds: config.timeLimitMinutes * 60,
        isRunning: true
    };
}

export function resetState(state: GameState): GameState {
    return {
        ...state,
        wordBuffer: '',
        publishedWords: [],
        isRunning: true
    };
}

export function stopState(state: GameState): GameState {
    return {
        ...state,
        isRunning: false
    };
}
