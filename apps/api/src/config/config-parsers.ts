const DURATION_REGEX = /^(\d+)(ms|s|m|h|d)$/i;

export function parseBoolean(value: string, key: string): boolean {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
        return true;
    }
    if (['0', 'false', 'no', 'off'].includes(normalized)) {
        return false;
    }

    throw new Error(`${key} must be a boolean value`);
}

export function parsePositiveInt(
    value: string,
    key: string,
    options: { min?: number; max?: number } = {},
): number {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed)) {
        throw new Error(`${key} must be an integer`);
    }

    const min = options.min ?? 1;
    if (parsed < min) {
        throw new Error(`${key} must be >= ${min}`);
    }

    if (options.max !== undefined && parsed > options.max) {
        throw new Error(`${key} must be <= ${options.max}`);
    }

    return parsed;
}

export function parseDurationToMilliseconds(value: string, key: string): number {
    const match = value.trim().match(DURATION_REGEX);
    if (!match) {
        throw new Error(`${key} must match <number><unit> where unit is ms|s|m|h|d`);
    }

    const amount = Number.parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    switch (unit) {
        case 'ms':
            return amount;
        case 's':
            return amount * 1000;
        case 'm':
            return amount * 60 * 1000;
        case 'h':
            return amount * 60 * 60 * 1000;
        case 'd':
            return amount * 24 * 60 * 60 * 1000;
        default:
            throw new Error(`${key} has unsupported duration unit`);
    }
}

export function parseDurationToSeconds(value: string, key: string): number {
    const milliseconds = parseDurationToMilliseconds(value, key);
    return Math.floor(milliseconds / 1000);
}

export function splitCsv(value?: string): string[] {
    if (!value) {
        return [];
    }

    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

