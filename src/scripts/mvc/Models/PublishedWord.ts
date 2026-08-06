export interface PublishedWord {
    text: string;
    id: string;
    isValidated: boolean;
    fetchResult?: 'success' | 'validation-failure' | 'no-definition' | 'network-failure';
}

