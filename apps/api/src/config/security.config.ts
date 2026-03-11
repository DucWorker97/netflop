import { registerAs } from '@nestjs/config';
import {
    parseBoolean,
    parseDurationToMilliseconds,
    parseDurationToSeconds,
    parsePositiveInt,
    splitCsv,
} from './config-parsers';

export type CaptchaProvider = 'none' | 'recaptcha_v2' | 'recaptcha_v3' | 'turnstile';
export type MailProvider = 'none' | 'smtp' | 'resend';

export interface SecurityConfig {
    cors: {
        origins: string[];
        credentials: boolean;
    };
    auth: {
        jwt: {
            accessTtl: string;
            accessTtlSeconds: number;
            refreshTtl: string;
            refreshTtlSeconds: number;
        };
        loginProtection: {
            maxFailedAttempts: number;
            attemptWindow: string;
            attemptWindowMs: number;
            lockoutDuration: string;
            lockoutDurationMs: number;
        };
        passwordReset: {
            ttl: string;
            ttlSeconds: number;
            debugTokens: boolean;
            baseUrl?: string;
        };
    };
    captcha: {
        enabled: boolean;
        provider: CaptchaProvider;
        siteKey?: string;
        secretKey?: string;
        minimumScore: number;
        verifyUrl?: string;
    };
    mail: {
        enabled: boolean;
        provider: MailProvider;
        from?: string;
        host?: string;
        port: number;
        secure: boolean;
        user?: string;
        pass?: string;
        apiKey?: string;
    };
}

const DEFAULT_CORS_ORIGINS = [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:19006',
    'http://localhost:8081',
];

const DEFAULT_LOGIN_MAX_FAILED_ATTEMPTS = 5;
const DEFAULT_LOGIN_ATTEMPT_WINDOW = '15m';
const DEFAULT_LOGIN_LOCKOUT_DURATION = '15m';
const DEFAULT_PASSWORD_RESET_TTL = '1h';
const DEFAULT_ACCESS_TTL = '15m';
const DEFAULT_REFRESH_TTL = '7d';

const securityConfig = registerAs(
    'security',
    (): SecurityConfig => {
        const accessTtl = process.env.JWT_EXPIRES_IN || DEFAULT_ACCESS_TTL;
        const refreshTtl = process.env.JWT_REFRESH_EXPIRES_IN || DEFAULT_REFRESH_TTL;
        const passwordResetTtl = process.env.PASSWORD_RESET_EXPIRES_IN || DEFAULT_PASSWORD_RESET_TTL;
        const attemptWindow = process.env.LOGIN_ATTEMPT_WINDOW || DEFAULT_LOGIN_ATTEMPT_WINDOW;
        const lockoutDuration = process.env.LOGIN_LOCKOUT_DURATION || DEFAULT_LOGIN_LOCKOUT_DURATION;

        const corsOrigins = splitCsv(process.env.CORS_ORIGINS);
        const corsCredentials = process.env.CORS_CREDENTIALS
            ? parseBoolean(process.env.CORS_CREDENTIALS, 'CORS_CREDENTIALS')
            : true;
        const debugTokens = process.env.PASSWORD_RESET_DEBUG_TOKENS
            ? parseBoolean(process.env.PASSWORD_RESET_DEBUG_TOKENS, 'PASSWORD_RESET_DEBUG_TOKENS')
            : (process.env.NODE_ENV || 'development') !== 'production';
        const captchaEnabled = process.env.CAPTCHA_ENABLED
            ? parseBoolean(process.env.CAPTCHA_ENABLED, 'CAPTCHA_ENABLED')
            : false;
        const mailEnabled = process.env.MAIL_ENABLED
            ? parseBoolean(process.env.MAIL_ENABLED, 'MAIL_ENABLED')
            : false;
        const mailSecure = process.env.MAIL_SECURE
            ? parseBoolean(process.env.MAIL_SECURE, 'MAIL_SECURE')
            : false;

        return {
            cors: {
                origins: corsOrigins.length > 0 ? corsOrigins : DEFAULT_CORS_ORIGINS,
                credentials: corsCredentials,
            },
            auth: {
                jwt: {
                    accessTtl,
                    accessTtlSeconds: parseDurationToSeconds(accessTtl, 'JWT_EXPIRES_IN'),
                    refreshTtl,
                    refreshTtlSeconds: parseDurationToSeconds(refreshTtl, 'JWT_REFRESH_EXPIRES_IN'),
                },
                loginProtection: {
                    maxFailedAttempts: process.env.LOGIN_MAX_FAILED_ATTEMPTS
                        ? parsePositiveInt(process.env.LOGIN_MAX_FAILED_ATTEMPTS, 'LOGIN_MAX_FAILED_ATTEMPTS', {
                              min: 1,
                          })
                        : DEFAULT_LOGIN_MAX_FAILED_ATTEMPTS,
                    attemptWindow,
                    attemptWindowMs: parseDurationToMilliseconds(attemptWindow, 'LOGIN_ATTEMPT_WINDOW'),
                    lockoutDuration,
                    lockoutDurationMs: parseDurationToMilliseconds(
                        lockoutDuration,
                        'LOGIN_LOCKOUT_DURATION',
                    ),
                },
                passwordReset: {
                    ttl: passwordResetTtl,
                    ttlSeconds: parseDurationToSeconds(passwordResetTtl, 'PASSWORD_RESET_EXPIRES_IN'),
                    debugTokens,
                    baseUrl: process.env.PASSWORD_RESET_BASE_URL,
                },
            },
            captcha: {
                enabled: captchaEnabled,
                provider: (process.env.CAPTCHA_PROVIDER || 'none') as CaptchaProvider,
                siteKey: process.env.CAPTCHA_SITE_KEY,
                secretKey: process.env.CAPTCHA_SECRET_KEY,
                minimumScore: process.env.CAPTCHA_MIN_SCORE
                    ? Number.parseFloat(process.env.CAPTCHA_MIN_SCORE)
                    : 0.5,
                verifyUrl: process.env.CAPTCHA_VERIFY_URL,
            },
            mail: {
                enabled: mailEnabled,
                provider: (process.env.MAIL_PROVIDER || 'none') as MailProvider,
                from: process.env.MAIL_FROM,
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT
                    ? parsePositiveInt(process.env.MAIL_PORT, 'MAIL_PORT', {
                          min: 1,
                          max: 65535,
                      })
                    : 587,
                secure: mailSecure,
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
                apiKey: process.env.MAIL_API_KEY,
            },
        };
    },
);

export default securityConfig;

