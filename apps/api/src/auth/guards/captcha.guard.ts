import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { CaptchaService } from '../captcha.service';

/**
 * Guard that verifies CAPTCHA token from request body or header.
 * Skips validation when CAPTCHA is disabled via env config.
 *
 * Usage: @UseGuards(CaptchaGuard) on controller methods
 *
 * Client should send captcha token as:
 *   - body.captchaToken, OR
 *   - header: x-captcha-token
 */
@Injectable()
export class CaptchaGuard implements CanActivate {
    constructor(private readonly captchaService: CaptchaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (!this.captchaService.isEnabled) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const token =
            request.body?.captchaToken ||
            request.headers?.['x-captcha-token'];

        const result = await this.captchaService.verify(token);

        if (!result.success) {
            throw new ForbiddenException({
                code: 'CAPTCHA_FAILED',
                message: 'CAPTCHA verification failed',
                errorCodes: result.errorCodes,
            });
        }

        return true;
    }
}
