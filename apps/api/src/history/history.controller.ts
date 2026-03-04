import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    Headers,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PolicyGuard } from '../common/guards/policy.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserOwnedPolicy } from '../common/decorators/check-policy.decorator';
import { User } from '@prisma/client';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('history')
@UseGuards(JwtAuthGuard, PolicyGuard)
@UserOwnedPolicy()
export class HistoryController {
    constructor(private readonly historyService: HistoryService) { }

    @Get()
    async findAll(
        @CurrentUser() user: User,
        @Headers('x-profile-id') profileId?: string,
        @Query('continueWatching') continueWatching?: string,
    ) {
        const isContinueWatching = continueWatching === 'true';
        const data = await this.historyService.findAll(user.id, isContinueWatching, profileId);
        return { data };
    }

    @Get(':movieId')
    async getMovieProgress(
        @CurrentUser() user: User,
        @Headers('x-profile-id') profileId?: string,
        @Param('movieId', ParseUUIDPipe) movieId?: string,
    ) {
        const progress = await this.historyService.getMovieProgress(user.id, movieId!, profileId);
        return { data: progress };
    }

    @Post(':movieId')
    async updateProgress(
        @CurrentUser() user: User,
        @Headers('x-profile-id') profileId?: string,
        @Param('movieId', ParseUUIDPipe) movieId?: string,
        @Body() dto?: UpdateProgressDto,
    ) {
        const result = await this.historyService.updateProgress(user.id, movieId!, dto!, profileId);
        return { data: result };
    }
}

