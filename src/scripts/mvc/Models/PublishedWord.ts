export type PublishedWordStatus = 'pending' | 'valid' | 'invalid' | 'stale';

export interface PublishedWord {
    text: string;
    status: PublishedWordStatus;
    referenceUrl?: string;
}
