import { formatResult } from '../../format.js';

export class ResultsController {
    private resultsElement: HTMLElement;

    constructor(resultsId: string) {
        this.resultsElement = document.getElementById(resultsId)!;
    }

    showPending(): void {
        this.resultsElement.classList.remove('hidden');
        this.resultsElement.classList.add('pending-result');
        this.resultsElement.textContent = 'Result:  ';
    }

    reportResults(successCount?: number): void {
        let res = successCount || 0;
        const successElements = document.getElementsByClassName('success');
        for (const element of successElements) {
            const word = element.textContent;
            if (word) {
                res += word.length - 2;
            }
        }

        this.resultsElement.classList.remove('pending-result');
        this.resultsElement.textContent = 'Result: ' + formatResult(res);
    }
}
