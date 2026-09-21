
const DURATION_MAP: Record<string, number> = {
    d: 1000 * 60 * 60 * 24,
    h: 1000 * 60 * 60,
    m: 1000 * 60,
    s: 1000,
};

export function parseDuration(value: string) {

    const match = value.match(/^(\d+)([dhms])$/);

    if (!match) {
        throw new Error(`Invalid duration format: ${value}`);
    }

    const [, amountStr, unit] = match;
    const amount = Number(amountStr);

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(`Invalid duration number: ${value}`);
    }

    return amount * DURATION_MAP[unit];
}
