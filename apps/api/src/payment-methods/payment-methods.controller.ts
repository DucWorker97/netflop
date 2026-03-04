import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentMethodsService } from './payment-methods.service';

class CreatePaymentMethodDto {
    @IsString()
    @MinLength(12)
    cardNumber!: string;

    @IsInt()
    @Min(1)
    @Max(12)
    expMonth!: number;

    @IsInt()
    @Min(2020)
    @Max(2100)
    expYear!: number;

    @IsOptional()
    @IsString()
    brand?: string;
}

@Controller('payment-methods')
@UseGuards(JwtAuthGuard)
export class PaymentMethodsController {
    constructor(private readonly paymentMethodsService: PaymentMethodsService) { }

    @Get()
    async list(@CurrentUser() user: any) {
        const data = await this.paymentMethodsService.list(user.id);
        return { data };
    }

    @Post()
    async create(@CurrentUser() user: any, @Body() dto: CreatePaymentMethodDto) {
        const data = await this.paymentMethodsService.create(user.id, dto);
        return { data };
    }

    @Patch(':id/default')
    async setDefault(
        @CurrentUser() user: any,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        const data = await this.paymentMethodsService.setDefault(user.id, id);
        return { data };
    }

    @Delete(':id')
    async remove(
        @CurrentUser() user: any,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        const data = await this.paymentMethodsService.remove(user.id, id);
        return { data };
    }
}
