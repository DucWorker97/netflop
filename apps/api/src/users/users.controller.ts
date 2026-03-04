import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Req() req: any) {
        const profile = await this.usersService.getProfile(req.user.id);
        return { data: profile };
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    async changePassword(
        @Req() req: any,
        @Body() dto: { currentPassword: string; newPassword: string }
    ) {
        await this.usersService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
        return { data: { message: 'Password changed successfully' } };
    }
}
