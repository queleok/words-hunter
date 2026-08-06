import { PublishedWord } from '../Models/GameState.js';
import { FetchResult } from '../../queue.js';
import { ScoreView } from '../Views/ScoreView.js';

export class PublishController {
    private scoreView: ScoreView;
    private onNetworkFailure?: () => void;

    constructor(scoreContainerId: string) {
        this.scoreView = new ScoreView(document.getElementById(scoreContainerId)!);
    }

    async publish(word: string, result: FetchResult): Promise<void> {
        const id = 'w_' + word;
        const publishedWord: PublishedWord = {
            text: word,
            id: id,
            isValidated: true,
            fetchResult: result
        };

        this.scoreView.appendPublished(publishedWord);

        if (result === 'network-failure') {
            this.onNetworkFailure?.();
        }
    }

    resendFailed(): void {
        const failedWords = document.querySelectorAll('.network-failure');
        for (const word of failedWords) {
            word.classList.remove('network-failure');
            word.classList.add('pending-score');
        }
    }

    showDisclaimer(): void {
        const disclaimer = document.getElementById('network-issues-disclaimer');
        if (disclaimer) {
            disclaimer.classList.remove('hidden');
        }
    }

    hideDisclaimer(): void {
        const disclaimer = document.getElementById('network-issues-disclaimer');
        if (disclaimer) {
            disclaimer.classList.add('hidden');
        }
    }
}
