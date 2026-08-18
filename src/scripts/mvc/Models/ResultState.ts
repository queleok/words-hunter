export interface ResultState {
    show: boolean;
    points: number;
    pending: boolean;
}

export function createResultState(): ResultState {
    return { show: false, points: 0, pending: true };
}
