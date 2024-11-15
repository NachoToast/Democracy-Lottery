/* eslint-disable @typescript-eslint/no-non-null-assertion */
export function gcf(...numbers: number[]): number {
    const sortedNumbers = numbers.filter((e) => e > 0).sort((a, b) => a - b);

    if (sortedNumbers.length <= 1) {
        return sortedNumbers[0] ?? 1;
    }

    const smallestNumber = sortedNumbers[0]!;

    const eligibleFactors = new Array<number>();

    const halfOfSmallestNumber = Math.floor(smallestNumber / 2);

    for (let n = 2; n <= halfOfSmallestNumber; n++) {
        if (smallestNumber % n === 0) {
            eligibleFactors.push(n);
        }
    }

    eligibleFactors.push(smallestNumber);

    for (let i = 1; i < sortedNumbers.length; i++) {
        const num = sortedNumbers[i]!;

        for (let j = 0; j < eligibleFactors.length; j++) {
            if (num % eligibleFactors[j]! !== 0) {
                eligibleFactors.splice(j, 1);

                if (eligibleFactors.length === 1) {
                    return eligibleFactors[0]!;
                }

                if (eligibleFactors.length === 0) {
                    // Possible in first iteration.
                    return 1;
                }
            }
        }
    }

    return eligibleFactors[eligibleFactors.length - 1] ?? 1;
}

export function decideDisplayPercentage(chance: number): string {
    if (chance === 0 || Number.isNaN(chance)) {
        return '0%';
    } else if (chance < 1) {
        return '<1%';
    } else {
        return `${Math.round(chance).toString()}%`;
    }
}
