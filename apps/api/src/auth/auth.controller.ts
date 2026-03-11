import {
    Controller,
    Post,
    Get,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Req,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CaptchaGuard } from './guards/captcha.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    /**
     * Register - rate limited: 5 requests per 60 seconds
     * Protected by CAPTCHA when enabled
     */
    @Post('register')
    @UseGuards(CaptchaGuard)
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterDto) {
        const result = await this.authService.register(dto);
        return {
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresIn: result.expiresIn,
                user: this.formatUser(result.user),
            },
        };
    }

    /**
     * Login - rate limited: 10 requests per 60 seconds
     * Protected by CAPTCHA when enabled
     */
    @Post('login')
    @UseGuards(CaptchaGuard)
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto, @Req() req: Request) {
        const result = await this.authService.login(dto, {
            ipAddress: this.getClientIp(req),
            userAgent: req.headers['user-agent'],
        });
        return {
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresIn: result.expiresIn,
                user: this.formatUser(result.user),
            },
        };
    }

    /**
     * Forgot password - rate limited and email-enumeration safe
     */
    @Post('forgot-password')
    @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        const result = await this.authService.forgotPassword(dto.email);
        return { data: result };
    }

    /**
     * Reset password using one-time token
     */
    @Post('reset-password')
    @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        const result = await this.authService.resetPassword(dto.token, dto.newPassword);
        return { data: result };
    }

    /**
     * Refresh - rate limited: 30 requests per 60 seconds
     */
    @Post('refresh')
    @Throttle({ default: { limit: 30, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() dto: RefreshDto) {
        const result = await this.authService.refresh(dto.refreshToken);
        return {
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresIn: result.expiresIn,
                user: this.formatUser(result.user),
            },
        };
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @SkipThrottle()
    @HttpCode(HttpStatus.OK)
    async logout(@Body() dto: RefreshDto) {
        await this.authService.logout(dto.refreshToken);
        return {
            data: {
                message: 'Logged out successfully',
            },
        };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @SkipThrottle()
    async getMe(@CurrentUser() user: User) {
        return {
            data: this.formatUser(user),
        };
    }

    private formatUser(user: User) {
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt.toISOString(),
        };
    }

    private getClientIp(req: Request): string | undefined {
        const forwardedFor = req.headers['x-forwarded-for'];
        if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
            return forwardedFor.split(',')[0]?.trim();
        }

        return req.ip;
    }
}
