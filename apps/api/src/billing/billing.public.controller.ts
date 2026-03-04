import { Controller, Get } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingPublicController {
    constructor(private readonly billingService: BillingService) { }

    @Get('plans')
    getPlans() {
        return this.billingService.getPlans();
    }
}
