import {
    Controller,
    Post,
    Get,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    /**
     * Register - rate limited: 5 requests per 60 seconds
     */
    @Post('register')
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
     */
    @Post('login')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto) {
        const result = await this.authService.login(dto);
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
            createdAt: user.createdAt.toISOString(),
        };
    }
}
