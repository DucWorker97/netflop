import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';

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

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    async register(dto: RegisterDto): Promise<{ user: User } & AuthTokens> {
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException({
                code: 'EMAIL_ALREADY_EXISTS',
                message: 'Email already registered',
            });
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.usersService.create({
            email: dto.email,
            passwordHash,
        });

        const tokens = await this.generateTokens(user);
        await this.saveRefreshToken(user.id, tokens.refreshToken);

        return { user, ...tokens };
    }

    async login(dto: LoginDto): Promise<{ user: User } & AuthTokens> {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException({
                code: 'AUTH_INVALID_CREDENTIALS',
                message: 'Invalid email or password',
            });
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException({
                code: 'AUTH_INVALID_CREDENTIALS',
                message: 'Invalid email or password',
            });
        }

        const tokens = await this.generateTokens(user);
        await this.saveRefreshToken(user.id, tokens.refreshToken);

        return { user, ...tokens };
    }

    async refresh(refreshToken: string): Promise<{ user: User } & AuthTokens> {
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

        const expiresInStr = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
        const expiresIn = this.parseExpiresIn(expiresInStr);

        return { accessToken, refreshToken, expiresIn };
    }

    private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
        const tokenHash = this.hashToken(refreshToken);
        const expiresInStr = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
        const expiresInMs = this.parseExpiresIn(expiresInStr) * 1000;

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

    private parseExpiresIn(str: string): number {
        const match = str.match(/^(\d+)([smhd])$/);
        if (!match) return 900; // default 15m

        const value = parseInt(match[1] as string, 10);
        const unit = match[2];

        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 'd': return value * 86400;
            default: return 900;
        }
    }
}
