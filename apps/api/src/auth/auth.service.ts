import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    ConflictException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { NotificationType, User } from '@prisma/client';
import { assertStrongPassword, normalizeEmail } from '../common/utils/security';
import { SecurityConfig } from '../config/security.config';

interface TokenPayload {
    sub: string;
    email: string;
    role: string;
}

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

interface LoginRequestContext {
    ipAddress?: string;
    userAgent?: string | string[];
}

const PASSWORD_RESET_NOTIFICATION_TITLE = 'Password changed';
const SECURITY_ALERT_TITLE = 'Security alert';

@Injectable()
export class AuthService {
    private readonly security: SecurityConfig;

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private mailService: MailService,
        configService: ConfigService,
    ) {
        this.security = configService.getOrThrow<SecurityConfig>('security');
    }

    async register(dto: RegisterDto): Promise<{ user: User } & AuthTokens> {
        const email = normalizeEmail(dto.email);
        assertStrongPassword(dto.password);

        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            throw new ConflictException({
                code: 'EMAIL_ALREADY_EXISTS',
                message: 'Email already registered',
            });
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.usersService.create({
            email,
            passwordHash,
        });

        const tokens = await this.generateTokens(user);
        await this.saveRefreshToken(user.id, tokens.refreshToken);

        return { user, ...tokens };
    }

    async forgotPassword(email: string) {
        const normalizedEmail = normalizeEmail(email);
        const user = await this.usersService.findByEmail(normalizedEmail);
        const response: {
            message: string;
            resetToken?: string;
            resetUrl?: string;
            expiresAt?: string;
        } = {
            message: 'If an account exists for that email, password reset instructions have been generated.',
        };

        if (!user) {
            return response;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(resetToken);
        const expiresAt = new Date(Date.now() + this.getPasswordResetTtlSeconds() * 1000);

        await this.prisma.$transaction([
            this.prisma.passwordResetToken.updateMany({
                where: {
                    userId: user.id,
                    usedAt: null,
                    expiresAt: { gt: new Date() },
                },
                data: { usedAt: new Date() },
            }),
            this.prisma.passwordResetToken.create({
                data: {
                    userId: user.id,
                    tokenHash,
                    expiresAt,
                },
            }),
        ]);

        if (this.isPasswordResetDebugEnabled()) {
            response.resetToken = resetToken;
            response.expiresAt = expiresAt.toISOString();
            response.resetUrl = this.buildPasswordResetUrl(resetToken);
        }

        // Send password reset email if mail is enabled
        if (this.mailService.isEnabled) {
            const mailResetUrl = this.buildPasswordResetUrl(resetToken) || '';
            if (mailResetUrl) {
                await this.mailService.sendPasswordResetEmail(user.email, mailResetUrl);
            }
        }

        return response;
    }

    async resetPassword(token: string, newPassword: string) {
        assertStrongPassword(newPassword);

        const tokenHash = this.hashToken(token);
        const resetToken = await this.prisma.passwordResetToken.findFirst({
            where: {
                tokenHash,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
            include: {
                user: true,
            },
        });

        if (!resetToken) {
            throw new BadRequestException({
                code: 'AUTH_INVALID_RESET_TOKEN',
                message: 'Invalid or expired password reset token',
            });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        const usedAt = new Date();

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: resetToken.userId },
                data: { passwordHash: newHash },
            }),
            this.prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { usedAt },
            }),
            this.prisma.passwordResetToken.updateMany({
                where: {
                    userId: resetToken.userId,
                    usedAt: null,
                },
                data: { usedAt },
            }),
            this.prisma.refreshToken.updateMany({
                where: {
                    userId: resetToken.userId,
                    revoked: false,
                },
                data: { revoked: true },
            }),
            this.prisma.notification.create({
                data: {
                    userId: resetToken.userId,
                    type: NotificationType.ALERT,
                    title: PASSWORD_RESET_NOTIFICATION_TITLE,
                    message:
                        'Your password was changed. If this was not you, contact support immediately.',
                },
            }),
        ]);

        return {
            message: 'Password reset successfully',
        };
    }

    async login(dto: LoginDto, context: LoginRequestContext = {}): Promise<{ user: User } & AuthTokens> {
        const email = normalizeEmail(dto.email);
        const activeLockout = await this.getActiveLockout(email);

        if (activeLockout) {
            throw new HttpException({
                code: 'AUTH_TOO_MANY_ATTEMPTS',
                message: 'Too many failed login attempts. Please try again later.',
                details: activeLockout,
            }, HttpStatus.TOO_MANY_REQUESTS);
        }

        const user = await this.usersService.findByEmail(email);
        const isPasswordValid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

        await this.recordLoginAttempt({
            userId: user?.id,
            email,
            ipAddress: context.ipAddress,
            userAgent: this.normalizeUserAgent(context.userAgent),
            succeeded: isPasswordValid,
        });

        if (!user || !isPasswordValid) {
            const failedAttempts = await this.countRecentFailedAttempts(email);
            if (user && failedAttempts === this.security.auth.loginProtection.maxFailedAttempts) {
                await this.createLoginAlert(user.id);
            }

            const currentLockout = await this.getActiveLockout(email);
            if (currentLockout) {
                throw new HttpException({
                    code: 'AUTH_TOO_MANY_ATTEMPTS',
                    message: 'Too many failed login attempts. Please try again later.',
                    details: currentLockout,
                }, HttpStatus.TOO_MANY_REQUESTS);
            }

            throw new UnauthorizedException({
                code: 'AUTH_INVALID_CREDENTIALS',
                message: 'Invalid email or password',
            });
        }

        // Check if account is disabled
        if (!user.isActive) {
            throw new HttpException({
                code: 'ACCOUNT_DISABLED',
                message: 'Your account has been disabled. Contact support for assistance.',
                disabledAt: user.disabledAt?.toISOString(),
            }, HttpStatus.FORBIDDEN);
        }

        const tokens = await this.generateTokens(user);
        await this.saveRefreshToken(user.id, tokens.refreshToken);

        return { user, ...tokens };
    }

    async refresh(refreshToken: string): Promise<{ user: User } & AuthTokens> {
        if (!refreshToken) {
            throw new BadRequestException({
                code: 'AUTH_REFRESH_TOKEN_REQUIRED',
                message: 'Refresh token is required',
            });
        }

        const tokenHash = this.hashToken(refreshToken);

        const storedToken = await this.prisma.refreshToken.findFirst({
            where: {
                token: tokenHash,
                revoked: false,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });

        if (!storedToken) {
            throw new UnauthorizedException({
                code: 'AUTH_INVALID_REFRESH_TOKEN',
                message: 'Invalid or expired refresh token',
            });
        }

        // Revoke old token (token rotation)
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revoked: true },
        });

        // Generate new tokens
        const tokens = await this.generateTokens(storedToken.user);
        await this.saveRefreshToken(storedToken.user.id, tokens.refreshToken);

        return { user: storedToken.user, ...tokens };
    }

    async logout(refreshToken: string): Promise<void> {
        if (!refreshToken) {
            return;
        }

        const tokenHash = this.hashToken(refreshToken);

        await this.prisma.refreshToken.updateMany({
            where: { token: tokenHash },
            data: { revoked: true },
        });
    }

    private async generateTokens(user: User): Promise<AuthTokens> {
        const payload: TokenPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload);
        const refreshToken = crypto.randomBytes(64).toString('hex');
        const expiresIn = this.security.auth.jwt.accessTtlSeconds;

        return { accessToken, refreshToken, expiresIn };
    }

    private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
        const tokenHash = this.hashToken(refreshToken);
        const expiresInMs = this.security.auth.jwt.refreshTtlSeconds * 1000;

        await this.prisma.refreshToken.create({
            data: {
                userId,
                token: tokenHash,
                expiresAt: new Date(Date.now() + expiresInMs),
            },
        });
    }

    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private getPasswordResetTtlSeconds(): number {
        return this.security.auth.passwordReset.ttlSeconds;
    }

    private async recordLoginAttempt(params: {
        userId?: string;
        email: string;
        ipAddress?: string;
        userAgent?: string;
        succeeded: boolean;
    }) {
        await this.prisma.loginAttempt.create({
            data: {
                userId: params.userId,
                email: params.email,
                ipAddress: params.ipAddress?.slice(0, 64) || null,
                userAgent: params.userAgent?.slice(0, 255) || null,
                succeeded: params.succeeded,
            },
        });
    }

    private async countRecentFailedAttempts(email: string): Promise<number> {
        const since = await this.getAttemptWindowStart(email);

        return this.prisma.loginAttempt.count({
            where: {
                email,
                succeeded: false,
                createdAt: { gte: since },
            },
        });
    }

    private async getActiveLockout(email: string) {
        const since = await this.getAttemptWindowStart(email);
        const maxFailedAttempts = this.security.auth.loginProtection.maxFailedAttempts;
        const failedAttempts = await this.prisma.loginAttempt.findMany({
            where: {
                email,
                succeeded: false,
                createdAt: { gte: since },
            },
            orderBy: { createdAt: 'desc' },
            take: maxFailedAttempts,
        });

        if (failedAttempts.length < maxFailedAttempts) {
            return null;
        }

        const newestAttempt = failedAttempts[0];
        if (!newestAttempt) {
            return null;
        }

        const lockedUntil = new Date(
            newestAttempt.createdAt.getTime() + this.security.auth.loginProtection.lockoutDurationMs,
        );
        if (lockedUntil <= new Date()) {
            return null;
        }

        return {
            failedAttempts: failedAttempts.length,
            lockedUntil: lockedUntil.toISOString(),
            retryAfterSeconds: Math.ceil((lockedUntil.getTime() - Date.now()) / 1000),
        };
    }

    private async getAttemptWindowStart(email: string): Promise<Date> {
        const defaultWindowStart = new Date(
            Date.now() - this.security.auth.loginProtection.attemptWindowMs,
        );
        const lastSuccess = await this.prisma.loginAttempt.findFirst({
            where: {
                email,
                succeeded: true,
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
        });

        if (lastSuccess && lastSuccess.createdAt > defaultWindowStart) {
            return lastSuccess.createdAt;
        }

        return defaultWindowStart;
    }

    private async createLoginAlert(userId: string) {
        const existingRecentAlert = await this.prisma.notification.findFirst({
            where: {
                userId,
                type: NotificationType.ALERT,
                title: SECURITY_ALERT_TITLE,
                createdAt: {
                    gte: new Date(Date.now() - this.security.auth.loginProtection.lockoutDurationMs),
                },
            },
        });

        if (existingRecentAlert) {
            return;
        }

        await this.prisma.notification.create({
            data: {
                userId,
                type: NotificationType.ALERT,
                title: SECURITY_ALERT_TITLE,
                message:
                    `We detected multiple failed login attempts on your account. Login is temporarily locked for ${this.security.auth.loginProtection.lockoutDuration}.`,
            },
        });
    }

    private normalizeUserAgent(userAgent?: string | string[]): string | undefined {
        if (Array.isArray(userAgent)) {
            return userAgent[0];
        }

        return userAgent;
    }

    private isPasswordResetDebugEnabled(): boolean {
        return this.security.auth.passwordReset.debugTokens;
    }

    private buildPasswordResetUrl(resetToken: string): string | undefined {
        const baseUrl = this.security.auth.passwordReset.baseUrl;
        if (!baseUrl) {
            return undefined;
        }

        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}token=${encodeURIComponent(resetToken)}`;
    }
}
