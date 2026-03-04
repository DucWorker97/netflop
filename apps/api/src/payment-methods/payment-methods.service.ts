import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreatePaymentMethodInput {
    cardNumber: string;
    expMonth: number;
    expYear: number;
    brand?: string;
}

@Injectable()
export class PaymentMethodsService {
    constructor(private prisma: PrismaService) { }

    async list(userId: string) {
        return this.prisma.paymentMethod.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' },
            ],
            select: {
                id: true,
                brand: true,
                last4: true,
                expMonth: true,
                expYear: true,
                isDefault: true,
                createdAt: true,
            },
        });
    }

    async create(userId: string, input: CreatePaymentMethodInput) {
        const normalizedNumber = input.cardNumber.replace(/\s/g, '');
        const last4 = normalizedNumber.slice(-4);
        const brand = input.brand || this.detectBrand(normalizedNumber);

        const existingDefault = await this.prisma.paymentMethod.findFirst({
            where: { userId, isDefault: true },
        });

        const method = await this.prisma.paymentMethod.create({
            data: {
                userId,
                brand,
                last4,
                expMonth: input.expMonth,
                expYear: input.expYear,
                isDefault: !existingDefault,
            },
            select: {
                id: true,
                brand: true,
                last4: true,
                expMonth: true,
                expYear: true,
                isDefault: true,
                createdAt: true,
            },
        });

        return method;
    }

    async setDefault(userId: string, id: string) {
        const method = await this.prisma.paymentMethod.findUnique({ where: { id } });
        if (!method) {
            throw new NotFoundException('Payment method not found');
        }
        if (method.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        await this.prisma.$transaction([
            this.prisma.paymentMethod.updateMany({
                where: { userId },
                data: { isDefault: false },
            }),
            this.prisma.paymentMethod.update({
                where: { id },
                data: { isDefault: true },
            }),
        ]);

        return { id };
    }

    async remove(userId: string, id: string) {
        const method = await this.prisma.paymentMethod.findUnique({ where: { id } });
        if (!method) {
            throw new NotFoundException('Payment method not found');
        }
        if (method.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        await this.prisma.paymentMethod.delete({ where: { id } });

        if (method.isDefault) {
            const next = await this.prisma.paymentMethod.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            if (next) {
                await this.prisma.paymentMethod.update({
                    where: { id: next.id },
                    data: { isDefault: true },
                });
            }
        }

        return { id };
    }

    private detectBrand(cardNumber: string): string {
        if (cardNumber.startsWith('4')) return 'visa';
        if (cardNumber.startsWith('5')) return 'mastercard';
        if (cardNumber.startsWith('34') || cardNumber.startsWith('37')) return 'amex';
        return 'card';
    }
}
