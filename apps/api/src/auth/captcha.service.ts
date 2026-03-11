import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityConfig } from '../config/security.config';

interface CaptchaVerifyResult {
    success: boolean;
    score?: number;
    errorCodes?: string[];
}

const VERIFY_URLS: Record<string, string> = {
    recaptcha_v2: 'https://www.google.com/recaptcha/api/siteverify',
    recaptcha_v3: 'https://www.google.com/recaptcha/api/siteverify',
    turnstile: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
};

@Injectable()
export class CaptchaService {
    private readonly logger = new Logger(CaptchaService.name);
    private readonly security: SecurityConfig;

    constructor(configService: ConfigService) {
        this.security = configService.getOrThrow<SecurityConfig>('security');
    }

    get isEnabled(): boolean {
        return this.security.captcha.enabled && this.security.captcha.provider !== 'none';
    }

    async verify(token: string | undefined): Promise<CaptchaVerifyResult> {
        if (!this.isEnabled) {
            return { success: true };
        }

        if (!token) {
            return { success: false, errorCodes: ['missing-input-response'] };
        }

        const { provider, secretKey, minimumScore } = this.security.captcha;
        if (!secretKey) {
            this.logger.warn('CAPTCHA enabled but no secret key configured — skipping verification');
            return { success: true };
        }

        const verifyUrl = this.security.captcha.verifyUrl || VERIFY_URLS[provider];
        if (!verifyUrl) {
            this.logger.error(`Unknown CAPTCHA provider: ${provider}`);
            return { success: false, errorCodes: ['unknown-provider'] };
        }

        try {
            const body = new URLSearchParams({
                secret: secretKey,
                response: token,
            });

            const res = await fetch(verifyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            });

            const data = await res.json();

            if (!data.success) {
                return { success: false, errorCodes: data['error-codes'] || [] };
            }

            // For reCAPTCHA v3 / Turnstile, check score
            if (typeof data.score === 'number' && data.score < minimumScore) {
                this.logger.warn(`CAPTCHA score too low: ${data.score} < ${minimumScore}`);
                return { success: false, score: data.score, errorCodes: ['score-too-low'] };
            }

            return { success: true, score: data.score };
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`CAPTCHA verification failed: ${msg}`);
            return { success: false, errorCodes: ['verify-request-failed'] };
        }
    }
}
