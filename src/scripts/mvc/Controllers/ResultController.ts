import { ResultState, createResultState } from '../Models/ResultState.js';
import { ResultView } from '../Views/ResultView.js';

export class ResultController {
    private view: ResultView = new ResultView('result', 'word');
    private state: ResultState;
    private onEnd?: () => void;

    constructor(state?: ResultState) {
        this.state = state ? {...state} : createResultState();
    }

    setOnEnd(callback?: () => void): void {
        this.onEnd = callback;
    }

    end(words: Array<{ text: string }> | undefined): void {
        const points = words?.reduce((sum, w) => sum + Math.max(0, w.text.length - 2), 0) ?? 0;
        this.state.show = true;
        this.state.points = points;
        this.view.render(this.state);
        if (this.onEnd) {
            this.onEnd();
        }
    }

    getState(): ResultState {
        return this.state;
    }

    reset() {
        this.state = createResultState();
        this.view.render(this.state);
    }
}
