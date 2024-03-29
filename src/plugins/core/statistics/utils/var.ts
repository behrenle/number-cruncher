import { calculateAvg } from './avg';

export function calculateVar(xs: number[]): number {
    const avg = calculateAvg(xs);
    return xs.map((x) => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0);
}
