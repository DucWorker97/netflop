import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

interface CreateUserData {
    email: string;
    passwordHash: string;
    role?: UserRole;
}

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async create(data: CreateUserData): Promise<User> {
        return this.prisma.user.create({
            data: {
                email: data.email,
                passwordHash: data.passwordHash,
                role: data.role || UserRole.viewer,
            },
        });
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new BadRequestException({
                code: 'USER_NOT_FOUND',
                message: 'User not found',
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            throw new BadRequestException({
                code: 'INVALID_PASSWORD',
                message: 'Current password is incorrect',
            });
        }

        if (newPassword.length < 6) {
            throw new BadRequestException({
                code: 'PASSWORD_TOO_SHORT',
                message: 'New password must be at least 6 characters',
            });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash },
        });
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        favorites: true,
                        watchHistory: true,
                        ratings: true,
                    }
                }
            }
        });

        if (!user) {
            throw new BadRequestException({
                code: 'USER_NOT_FOUND',
                message: 'User not found',
            });
        }

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
            stats: {
                favorites: user._count.favorites,
                watchHistory: user._count.watchHistory,
                ratings: user._count.ratings,
            }
        };
    }
}
