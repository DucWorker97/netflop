import { Controller, Get, Put, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

class UpdateProfileDto {
    @IsEmail()
    @IsOptional()
    email?: string;
}

class ChangePasswordDto {
    @IsString()
    currentPassword!: string;

    @IsString()
    @MinLength(8)
    newPassword!: string;
}

class DeleteAccountDto {
    @IsString()
    password!: string;
}

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
    constructor(private readonly accountService: AccountService) { }

    /**
     * Get complete account overview - all data in one call
     */
    @Get('settings')
    async getSettings(@CurrentUser() user: any) {
        return this.accountService.getAccountOverview(user.id);
    }

    /**
     * Get billing summary for quick display
     */
    @Get('billing-summary')
    async getBillingSummary(@CurrentUser() user: any) {
        return this.accountService.getBillingSummary(user.id);
    }

    /**
     * Update profile (email)
     */
    @Put('profile')
    async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
        return this.accountService.updateProfile(user.id, dto);
    }

    /**
     * Change password
     */
    @Post('change-password')
    async changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
        return this.accountService.changePassword(user.id, dto.currentPassword, dto.newPassword);
    }

    /**
     * Delete account permanently
     */
    @Delete('delete')
    async deleteAccount(@CurrentUser() user: any, @Body() dto: DeleteAccountDto) {
        return this.accountService.deleteAccount(user.id, dto.password);
    }
}
