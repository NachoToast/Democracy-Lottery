const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const units = [
    ['year', YEAR],
    ['month', MONTH],
    ['week', WEEK],
    ['day', DAY],
    ['hour', HOUR],
    ['minute', MINUTE],
    ['second', SECOND],
] as const;

export function relativeTime(date1: Date, date2?: Date): string {
    const t1 = date1.getTime();
    const t2 = date2?.getTime() ?? Date.now();

    const elapsed = t1 - t2;
    const elapsedAbs = Math.abs(elapsed);

    for (const [unitName, unitValue] of units) {
        const unitsAgo = Math.floor(elapsedAbs / unitValue);
        if (unitsAgo > 0) {
            return `${unitsAgo.toLocaleString()} ${unitName}${
                unitsAgo > 1 ? 's' : ''
            } ago`;
        }
    }

    return 'just now';
}
