
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan, SubscriptionStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class BillingService {
    constructor(private prisma: PrismaService) { }

    private readonly planCatalog = [
        { id: SubscriptionPlan.FREE, name: 'Free', monthlyPrice: 0, yearlyPrice: 0 },
        { id: SubscriptionPlan.BASIC, name: 'Basic', monthlyPrice: 9.99, yearlyPrice: 95.88 },
        { id: SubscriptionPlan.PREMIUM, name: 'Premium', monthlyPrice: 15.99, yearlyPrice: 153.50 },
    ] as const;

    private getPlanPricing(plan: SubscriptionPlan) {
        const match = this.planCatalog.find(item => item.id === plan);
        return match ? { monthly: match.monthlyPrice, yearly: match.yearlyPrice } : { monthly: 0, yearly: 0 };
    }

    getPlans() {
        return this.planCatalog.map(plan => ({
            id: plan.id,
            name: plan.name,
            monthlyPrice: plan.monthlyPrice,
            yearlyPrice: plan.yearlyPrice,
        }));
    }

    async subscribe(userId: string, plan: SubscriptionPlan, billingCycle: 'monthly' | 'annual' = 'monthly') {
        if (plan === SubscriptionPlan.FREE) {
            throw new BadRequestException('Use cancel to switch to free plan');
        }

        // 1. Check existing subscription
        const existing = await this.prisma.subscription.findUnique({
            where: { userId },
        });

        // 2. Mock Payment Processing
        const success = await this.processPayment(userId, plan);
        if (!success) {
            throw new BadRequestException('Payment failed');
        }

        const now = new Date();
        const endDate = new Date();
        const isAnnual = billingCycle === 'annual';
        endDate.setMonth(endDate.getMonth() + (isAnnual ? 12 : 1));

        // 3. Upsert Subscription
        const sub = await this.prisma.subscription.upsert({
            where: { userId },
            create: {
                userId,
                plan,
                status: SubscriptionStatus.ACTIVE,
                startDate: now,
                endDate: endDate,
            },
            update: {
                plan,
                status: SubscriptionStatus.ACTIVE,
                endDate: endDate, // Extend or reset
            },
        });

        // 4. Record Payment
        const pricing = this.getPlanPricing(plan);
        await this.prisma.payment.create({
            data: {
                subscriptionId: sub.id,
                amount: isAnnual ? pricing.yearly : pricing.monthly,
                currency: 'USD',
                status: PaymentStatus.SUCCESS,
                provider: 'MOCK',
                providerTxId: `tx_${Date.now()}`,
            },
        });

        return sub;
    }

    async cancel(userId: string) {
        const sub = await this.prisma.subscription.findUnique({ where: { userId } });
        if (!sub) {
            throw new NotFoundException('No active subscription found');
        }

        // Update status to CANCELED, but keep endDate valid
        return this.prisma.subscription.update({
            where: { userId },
            data: {
                status: SubscriptionStatus.CANCELED
            },
        });
    }

    async getSubscription(userId: string) {
        const sub = await this.prisma.subscription.findUnique({
            where: { userId },
            include: { payments: { orderBy: { createdAt: 'desc' }, take: 5 } },
        });

        if (!sub) {
            return { plan: SubscriptionPlan.FREE, status: SubscriptionStatus.ACTIVE };
        }
        return sub;
    }

    async getInvoices(userId: string) {
        const sub = await this.prisma.subscription.findUnique({
            where: { userId },
            include: {
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });

        if (!sub) {
            return [];
        }

        return sub.payments.map(payment => ({
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            provider: payment.provider,
            providerTxId: payment.providerTxId,
            createdAt: payment.createdAt,
        }));
    }

    // Mock payment gateway interaction
    private async processPayment(userId: string, plan: string): Promise<boolean> {
        console.log(`Processing payment for user ${userId} plan ${plan}...`);
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    }
}
