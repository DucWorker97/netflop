
import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Get('movies/:id/similar')
    async getSimilarMovies(@Param('id') id: string, @Query('limit') limit?: number) {
        return this.aiService.getSimilarMovies(id, limit);
    }

    @UseGuards(JwtAuthGuard)
    @Get('recommendations')
    async getRecommendations(
        @CurrentUser() user: any,
        @Query('limit') limit?: number,
    ) {
        return this.aiService.getRecommendations(user.id, limit);
    }
}
