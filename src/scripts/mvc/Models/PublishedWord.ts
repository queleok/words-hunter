export type PublishedWordStatus = 'pending' | 'valid';

export interface PublishedWord {
    text: string;
    status: PublishedWordStatus;
}
