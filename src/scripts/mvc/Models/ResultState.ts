export interface ResultState {
    show: boolean;
    points: number;
}

export function createResultState(): ResultState {
    return { show: false, points: 0 };
}
