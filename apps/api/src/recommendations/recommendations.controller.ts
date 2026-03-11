/**
 * Recommendations Controller
 * Endpoints for AI-powered recommendations
 */

import {
    Controller,
    Get,
    Post,
    Query,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('recommendations')
export class RecommendationsController {
    constructor(
        private readonly recommendationsService: RecommendationsService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Get personalized recommendations for current user
     * GET /api/recommendations/for-you
     */
    @Get('for-you')
    @UseGuards(JwtAuthGuard)
    async getForYou(
        @Request() req: any,
        @Query('limit') limit?: string,
    ) {
        const userId = req.user.id;
        const numLimit = parseInt(limit || '10', 10);

        // Get AI recommendations
        const recommendations =
            await this.recommendationsService.getRecommendations(
                userId,
                numLimit,
            );

        if (recommendations.length > 0) {
            // Enrich with full movie data
            const movieIds = recommendations.map((r) => r.movie_id);
            const movies = await this.prisma.movie.findMany({
                where: { id: { in: movieIds } },
                select: {
                    id: true,
                    title: true,
                    posterUrl: true,
                    releaseYear: true,
                    durationSeconds: true,
                    genres: {
                        select: {
                            genre: { select: { id: true, name: true } },
                        },
                    },
                },
            });

            // Merge with AI scores and reasons
            const movieMap = new Map(movies.map((m: typeof movies[number]) => [m.id, m]));
            return {
                source: 'ai_curator',
                items: recommendations
                    .map((rec) => {
                        const movie = movieMap.get(rec.movie_id);
                        if (!movie) return null;
                        return {
                            ...movie,
                            genres: movie.genres.map((g: typeof movie.genres[number]) => g.genre),
                            score: rec.score,
                            reason: rec.reason,
                        };
                    })
                    .filter(Boolean),
            };
        }

        // Fallback: return popular movies
        const popular = await this.prisma.movie.findMany({
            where: {
                movieStatus: 'published',
                encodeStatus: 'ready',
            },
            orderBy: { createdAt: 'desc' },
            take: numLimit,
            select: {
                id: true,
                title: true,
                posterUrl: true,
                releaseYear: true,
                durationSeconds: true,
                genres: {
                    select: {
                        genre: { select: { id: true, name: true } },
                    },
                },
            },
        });

        return {
            source: 'fallback_popular',
            items: popular.map((m: typeof popular[number]) => ({
                ...m,
                genres: m.genres.map((g: typeof m.genres[number]) => g.genre),
                score: null,
                reason: 'New on Netflop',
            })),
        };
    }

    /**
     * Get similar movies for a specific movie
     * GET /api/recommendations/similar/:movieId
     */
    @Get('similar/:movieId')
    async getSimilar(
        @Param('movieId') movieId: string,
        @Query('limit') limit?: string,
    ) {
        const numLimit = parseInt(limit || '5', 10);

        const similar =
            await this.recommendationsService.getSimilarMovies(
                movieId,
                numLimit,
            );

        if (similar.length > 0) {
            const movieIds = similar.map((s) => s.movie_id);
            const movies = await this.prisma.movie.findMany({
                where: { id: { in: movieIds } },
                select: {
                    id: true,
                    title: true,
                    posterUrl: true,
                    releaseYear: true,
                    genres: {
                        select: {
                            genre: { select: { id: true, name: true } },
                        },
                    },
                },
            });

            const movieMap = new Map(movies.map((m: typeof movies[number]) => [m.id, m]));
            return {
                source: 'ai_curator',
                items: similar
                    .map((s) => {
                        const movie = movieMap.get(s.movie_id);
                        if (!movie) return null;
                        return {
                            ...movie,
                            genres: movie.genres.map((g: typeof movie.genres[number]) => g.genre),
                            similarity: s.similarity,
                        };
                    })
                    .filter(Boolean),
            };
        }

        // Fallback: same genre movies
        const sourceMovie = await this.prisma.movie.findUnique({
            where: { id: movieId },
            include: { genres: true },
        });

        if (!sourceMovie) {
            return { source: 'fallback', items: [] };
        }

        const genreIds = sourceMovie.genres.map((g: typeof sourceMovie.genres[number]) => g.genreId);
        const fallback = await this.prisma.movie.findMany({
            where: {
                id: { not: movieId },
                movieStatus: 'published',
                genres: { some: { genreId: { in: genreIds } } },
            },
            take: numLimit,
            select: {
                id: true,
                title: true,
                posterUrl: true,
                releaseYear: true,
                genres: {
                    select: {
                        genre: { select: { id: true, name: true } },
                    },
                },
            },
        });

        return {
            source: 'fallback_genre',
            items: fallback.map((m: typeof fallback[number]) => ({
                ...m,
                genres: m.genres.map((g: typeof m.genres[number]) => g.genre),
            })),
        };
    }

    /**
     * Get trending movies
     * GET /api/recommendations/trending
     */
    @Get('trending')
    async getTrending(
        @Query('days') days?: string,
        @Query('limit') limit?: string,
    ) {
        const numDays = parseInt(days || '7', 10);
        const numLimit = parseInt(limit || '10', 10);

        const trending = await this.recommendationsService.getTrending(
            numDays,
            numLimit,
        );

        if (trending.length > 0) {
            return { source: 'ai_curator', items: trending };
        }

        // Fallback
        const fallback = await this.prisma.movie.findMany({
            where: {
                movieStatus: 'published',
                encodeStatus: 'ready',
            },
            orderBy: { createdAt: 'desc' },
            take: numLimit,
            select: {
                id: true,
                title: true,
                posterUrl: true,
            },
        });

        return { source: 'fallback', items: fallback };
    }

    /**
     * Health check for AI service
     * GET /api/recommendations/health
     */
    @Get('health')
    async checkHealth() {
        const isHealthy = await this.recommendationsService.isHealthy();
        return {
            ai_curator: isHealthy ? 'connected' : 'unavailable',
            fallback: 'available',
        };
    }
}
