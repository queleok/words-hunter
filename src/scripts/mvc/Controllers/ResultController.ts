import { ResultState, createResultState } from '../Models/ResultState.js';
import { ResultView } from '../Views/ResultView.js';

export class ResultController {
    private view: ResultView = new ResultView('result', 'word');
    private state: ResultState;

    constructor(state?: ResultState) {
        this.state = state ? {...state} : createResultState();
    }

    show(): void {
        this.state.show = true;
        this.view.render(this.state);
    }

    end(words: Array<{ text: string }> | undefined): void {
        const points = words?.reduce((sum, w) => sum + Math.max(0, w.text.length - 2), 0) ?? 0;
        this.state.show = true;
        this.state.pending = false;
        this.state.points = points;
        this.view.render(this.state);
    }

    reset() {
        this.state = createResultState();
        this.view.render(this.state);
    }
}
