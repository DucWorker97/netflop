import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface AccountOverview {
    user: {
        id: string;
        email: string;
        createdAt: Date;
    };
    subscription: {
        plan: string;
        status: string;
        startDate: Date | null;
        endDate: Date | null;
    };
    paymentMethod: {
        id: string;
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
    } | null;
    billingHistory: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        createdAt: Date;
    }[];
    profiles: {
        id: string;
        name: string;
        avatarUrl: string | null;
        isKids: boolean;
        pinEnabled: boolean;
        maxRating: string;
    }[];
}

@Injectable()
export class AccountService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get complete account overview in a single query
     */
    async getAccountOverview(userId: string): Promise<AccountOverview> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscription: {
                    include: {
                        payments: {
                            orderBy: { createdAt: 'desc' },
                            take: 10,
                        },
                    },
                },
                paymentMethods: {
                    orderBy: [
                        { isDefault: 'desc' },
                        { createdAt: 'desc' },
                    ],
                    take: 1,
                },
                profiles: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
            },
            subscription: {
                plan: user.subscription?.plan || 'FREE',
                status: user.subscription?.status || 'ACTIVE',
                startDate: user.subscription?.startDate || null,
                endDate: user.subscription?.endDate || null,
            },
            paymentMethod: user.paymentMethods?.length
                ? {
                    id: user.paymentMethods[0].id,
                    brand: user.paymentMethods[0].brand,
                    last4: user.paymentMethods[0].last4,
                    expMonth: user.paymentMethods[0].expMonth,
                    expYear: user.paymentMethods[0].expYear,
                }
                : null,
            billingHistory: user.subscription?.payments.map(p => ({
                id: p.id,
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                createdAt: p.createdAt,
            })) || [],
            profiles: user.profiles.map(p => ({
                id: p.id,
                name: p.name,
                avatarUrl: p.avatarUrl,
                isKids: p.isKids,
                pinEnabled: p.pinEnabled,
                maxRating: p.maxRating,
            })),
        };
    }

    /**
     * Update user profile info
     */
    async updateProfile(userId: string, data: { email?: string }) {
        if (data.email) {
            const existing = await this.prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existing && existing.id !== userId) {
                throw new BadRequestException('Email already in use');
            }
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { email: data.email },
            select: { id: true, email: true },
        });
    }

    /**
     * Change password
     */
    async changePassword(userId: string, oldPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        if (newPassword.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters');
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash },
        });

        return { success: true };
    }

    /**
     * Delete account and all associated data
     */
    async deleteAccount(userId: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw new BadRequestException('Password is incorrect');
        }

        // Cascade delete handles related records
        await this.prisma.user.delete({
            where: { id: userId },
        });

        return { success: true };
    }

    /**
     * Get billing summary for quick display
     */
    async getBillingSummary(userId: string) {
        const sub = await this.prisma.subscription.findUnique({
            where: { userId },
            include: {
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        const planPrices = { FREE: 0, BASIC: 9.99, PREMIUM: 15.99 };
        const plan = sub?.plan || 'FREE';

        return {
            plan,
            status: sub?.status || 'ACTIVE',
            nextBillingDate: sub?.endDate || null,
            monthlyAmount: planPrices[plan as keyof typeof planPrices],
            lastPayment: sub?.payments[0] || null,
        };
    }
}
