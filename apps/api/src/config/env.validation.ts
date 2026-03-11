import {
    parseBoolean,
    parseDurationToMilliseconds,
    parsePositiveInt,
    splitCsv,
} from './config-parsers';

type EnvRecord = Record<string, unknown>;

const BOOLEAN_KEYS = [
    'CORS_CREDENTIALS',
    'PASSWORD_RESET_DEBUG_TOKENS',
    'CAPTCHA_ENABLED',
    'MAIL_ENABLED',
    'MAIL_SECURE',
] as const;

const DURATION_KEYS = [
    ['JWT_EXPIRES_IN', '15m'],
    ['JWT_REFRESH_EXPIRES_IN', '7d'],
    ['PASSWORD_RESET_EXPIRES_IN', '1h'],
    ['LOGIN_ATTEMPT_WINDOW', '15m'],
    ['LOGIN_LOCKOUT_DURATION', '15m'],
] as const;

const CAPTCHA_PROVIDERS = ['none', 'recaptcha_v2', 'recaptcha_v3', 'turnstile'];
const MAIL_PROVIDERS = ['none', 'smtp', 'resend'];

export function validateEnvironment(config: EnvRecord): EnvRecord {
    const errors: string[] = [];

    const env = config as Record<string, string | undefined>;

    const requiredKeys = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    for (const key of requiredKeys) {
        const value = env[key]?.trim();
        if (!value) {
            errors.push(`${key} is required`);
        }
    }

    for (const [key, fallback] of DURATION_KEYS) {
        const value = env[key] || fallback;
        try {
            parseDurationToMilliseconds(value, key);
        } catch (error) {
            errors.push((error as Error).message);
        }
    }

    if (env.LOGIN_MAX_FAILED_ATTEMPTS) {
        try {
            parsePositiveInt(env.LOGIN_MAX_FAILED_ATTEMPTS, 'LOGIN_MAX_FAILED_ATTEMPTS', {
                min: 1,
                max: 100,
            });
        } catch (error) {
            errors.push((error as Error).message);
        }
    }

    if (env.MAIL_PORT) {
        try {
            parsePositiveInt(env.MAIL_PORT, 'MAIL_PORT', { min: 1, max: 65535 });
        } catch (error) {
            errors.push((error as Error).message);
        }
    }

    for (const key of BOOLEAN_KEYS) {
        const raw = env[key];
        if (!raw) {
            continue;
        }

        try {
            parseBoolean(raw, key);
        } catch (error) {
            errors.push((error as Error).message);
        }
    }

    const corsOrigins = splitCsv(env.CORS_ORIGINS);
    for (const origin of corsOrigins) {
        if (origin === '*') {
            continue;
        }

        try {
            const parsed = new URL(origin);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                errors.push(`CORS_ORIGINS contains non-http origin: ${origin}`);
            }
        } catch {
            errors.push(`CORS_ORIGINS contains invalid URL: ${origin}`);
        }
    }

    const captchaProvider = (env.CAPTCHA_PROVIDER || 'none').toLowerCase();
    if (!CAPTCHA_PROVIDERS.includes(captchaProvider)) {
        errors.push(`CAPTCHA_PROVIDER must be one of: ${CAPTCHA_PROVIDERS.join(', ')}`);
    }

    const captchaEnabled = env.CAPTCHA_ENABLED
        ? parseBooleanSafe(env.CAPTCHA_ENABLED)
        : false;
    if (captchaEnabled && captchaProvider === 'none') {
        errors.push('CAPTCHA_PROVIDER cannot be "none" when CAPTCHA_ENABLED=true');
    }

    if (captchaEnabled && !env.CAPTCHA_SECRET_KEY) {
        errors.push('CAPTCHA_SECRET_KEY is required when CAPTCHA_ENABLED=true');
    }

    if (captchaEnabled && !env.CAPTCHA_SITE_KEY) {
        errors.push('CAPTCHA_SITE_KEY is required when CAPTCHA_ENABLED=true');
    }

    if (env.CAPTCHA_MIN_SCORE) {
        const minScore = Number.parseFloat(env.CAPTCHA_MIN_SCORE);
        if (!Number.isFinite(minScore) || minScore < 0 || minScore > 1) {
            errors.push('CAPTCHA_MIN_SCORE must be a number between 0 and 1');
        }
    }

    const mailProvider = (env.MAIL_PROVIDER || 'none').toLowerCase();
    if (!MAIL_PROVIDERS.includes(mailProvider)) {
        errors.push(`MAIL_PROVIDER must be one of: ${MAIL_PROVIDERS.join(', ')}`);
    }

    const mailEnabled = env.MAIL_ENABLED ? parseBooleanSafe(env.MAIL_ENABLED) : false;
    if (mailEnabled && !env.MAIL_FROM) {
        errors.push('MAIL_FROM is required when MAIL_ENABLED=true');
    }

    if (mailEnabled && mailProvider === 'smtp') {
        if (!env.MAIL_HOST) {
            errors.push('MAIL_HOST is required when MAIL_PROVIDER=smtp and MAIL_ENABLED=true');
        }
        if (!env.MAIL_PORT) {
            errors.push('MAIL_PORT is required when MAIL_PROVIDER=smtp and MAIL_ENABLED=true');
        }
    }

    if (mailEnabled && mailProvider === 'resend' && !env.MAIL_API_KEY) {
        errors.push('MAIL_API_KEY is required when MAIL_PROVIDER=resend and MAIL_ENABLED=true');
    }

    if (errors.length > 0) {
        throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
    }

    return config;
}

function parseBooleanSafe(raw: string): boolean {
    try {
        return parseBoolean(raw, 'boolean');
    } catch {
        return false;
    }
}

