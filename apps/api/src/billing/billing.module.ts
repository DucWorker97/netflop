
import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingPublicController } from './billing.public.controller';

@Module({
    controllers: [BillingController, BillingPublicController],
    providers: [BillingService],
    exports: [BillingService], // Export so Auth/Movies can check status
})
export class BillingModule { }
