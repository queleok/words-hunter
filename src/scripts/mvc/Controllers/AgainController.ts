export class AgainController {
    private againButton: HTMLElement;
    private onAgain?: () => void;

    constructor(againId: string) {
        this.againButton = document.getElementById(againId)!;
    }

    setOnAgain(callback?: () => void): void {
        this.onAgain = callback;
    }

    handleAgain(): void {
        if (this.onAgain) {
            this.onAgain();
        } else {
            console.log('Play again triggered');
        }
    }
}
