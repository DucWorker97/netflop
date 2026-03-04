
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionPlan } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

class SubscribeDto {
    @IsEnum(SubscriptionPlan)
    plan!: SubscriptionPlan;

    @IsOptional()
    @IsIn(['monthly', 'annual'])
    billingCycle?: 'monthly' | 'annual';
}

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @Post('subscribe')
    async subscribe(@CurrentUser() user: any, @Body() dto: SubscribeDto) {
        return this.billingService.subscribe(user.id, dto.plan, dto.billingCycle);
    }

    @Post('cancel')
    async cancel(@CurrentUser() user: any) {
        return this.billingService.cancel(user.id);
    }

    @Get('my-subscription')
    async getMySubscription(@CurrentUser() user: any) {
        return this.billingService.getSubscription(user.id);
    }

    @Get('invoices')
    async getInvoices(@CurrentUser() user: any) {
        return this.billingService.getInvoices(user.id);
    }
}
