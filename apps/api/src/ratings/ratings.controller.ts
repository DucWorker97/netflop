import { Controller, Post, Get, Delete, Param, Body, UseGuards, Req, HttpException, HttpStatus, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PolicyGuard } from '../common/guards/policy.guard';
import { MovieVisiblePolicy } from '../common/decorators/check-policy.decorator';
import { RatingsService } from './ratings.service';
import { RateMovieDto } from './dto/rate-movie.dto';

@Controller('ratings')
export class RatingsController {
    constructor(private ratingsService: RatingsService) { }

    /**
     * Rate a movie
     */
    @Post(':movieId')
    @UseGuards(JwtAuthGuard, PolicyGuard)
    @MovieVisiblePolicy('movieId')
    async rateMovie(
        @Req() req: any,
        @Param('movieId') movieId: string,
        @Body() dto: RateMovieDto,
    ) {
        try {
            console.log('[RatingsController] POST rating - req.user:', req.user);
            console.log('[RatingsController] movieId:', movieId, 'rating:', dto.rating);

            if (!req.user || !req.user.sub) {
                throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
            }

            const userId = req.user.sub;
            const rating = await this.ratingsService.rateMovie(userId, movieId, dto.rating, dto.comment);
            return { data: rating };
        } catch (error) {
            console.error('[RatingsController] Error in rateMovie:', error);
            throw error;
        }
    }

    /**
     * Get user's own rating for a movie
     */
    @Get(':movieId/user')
    @UseGuards(JwtAuthGuard)
    async getUserRating(@Req() req: any, @Param('movieId') movieId: string) {
        try {
            console.log('[RatingsController] GET user rating - req.user:', req.user);

            if (!req.user || !req.user.sub) {
                throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
            }

            const userId = req.user.sub;
            const rating = await this.ratingsService.getUserRating(userId, movieId);
            return { data: rating };
        } catch (error) {
            console.error('[RatingsController] Error in getUserRating:', error);
            throw error;
        }
    }

    /**
     * Get average rating stats for a movie (public endpoint)
     */
    @Get(':movieId/stats')
    @UseGuards(PolicyGuard)
    @MovieVisiblePolicy('movieId')
    async getMovieStats(@Param('movieId') movieId: string) {
        try {
            console.log('[RatingsController] GET stats for movieId:', movieId);
            const stats = await this.ratingsService.getMovieRatingStats(movieId);
            return { data: stats };
        } catch (error) {
            console.error('[RatingsController] Error in getMovieStats:', error);
            throw error;
        }
    }

    /**
     * List ratings for a movie (public)
     */
    @Get(':movieId/list')
    @UseGuards(PolicyGuard)
    @MovieVisiblePolicy('movieId')
    async listMovieRatings(
        @Param('movieId') movieId: string,
        @Query('limit') limit?: string,
    ) {
        try {
            const parsed = limit ? parseInt(limit, 10) : NaN;
            const parsedLimit = Number.isFinite(parsed) ? Math.min(parsed, 50) : 20;
            const ratings = await this.ratingsService.listMovieRatings(movieId, parsedLimit);
            return { data: ratings };
        } catch (error) {
            console.error('[RatingsController] Error in listMovieRatings:', error);
            throw error;
        }
    }

    /**
     * Delete rating
     */
    @Delete(':movieId')
    @UseGuards(JwtAuthGuard)
    async deleteRating(@Req() req: any, @Param('movieId') movieId: string) {
        try {
            if (!req.user || !req.user.sub) {
                throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
            }

            const userId = req.user.sub;
            await this.ratingsService.deleteRating(userId, movieId);
            return { data: { success: true } };
        } catch (error) {
            console.error('[RatingsController] Error in deleteRating:', error);
            throw error;
        }
    }
}
