import { ResultState } from '../Models/ResultState.js';

export class ResultView {
    private result: HTMLElement;
    private hide: HTMLElement;

    constructor(id: string, hideId: string) {
        this.result = document.getElementById(id) as HTMLElement;
        this.hide = document.getElementById(hideId) as HTMLElement;
    }

    render(state: ResultState): void {
        if (state.show) {
            this.result.classList.remove('hidden');
            this.hide.classList.add('hidden');
            this.result.textContent = `Score: ${state.points}`;
        } else {
            this.result.classList.add('hidden');
            this.hide.classList.remove('hidden');
        }
    }
}
