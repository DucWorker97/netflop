
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { catchError, retry, timeout } from 'rxjs/operators';
import { AxiosError } from 'axios';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly aiServiceUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
    }

    private getRequestConfig() {
        return this.httpService.axiosRef.defaults;
    }

    async getSimilarMovies(movieId: string, limit = 5) {
        try {
            const response = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/api/similar-movies`, {
                    movie_id: movieId,
                    limit,
                }).pipe(
                    timeout(3000),
                    retry({ count: 3, delay: 500 }),
                ),
            );

            const similarMovies = response.data.similar_movies || [];
            if (similarMovies.length === 0) return { movie_id: movieId, similar_movies: [] };

            const movieIds = similarMovies.map((m: any) => m.movie_id || m.id);
            const movies = await this.prisma.movie.findMany({
                where: { id: { in: movieIds } },
                select: {
                    id: true,
                    title: true,
                    posterUrl: true,
                    releaseYear: true,
                    genres: { select: { genre: { select: { id: true, name: true } } } },
                },
            });

            // Merge details
            const merged = similarMovies.map((sim: any) => {
                const details = movies.find((m: typeof movies[number]) => m.id === (sim.movie_id || sim.id));
                return {
                    ...sim,
                    id: sim.movie_id || sim.id, // Ensure consistent ID
                    ...details,
                };
            }).filter((m: any) => m.title); // Filter out missing movies

            return { movie_id: movieId, similar_movies: merged };

        } catch (error) {
            this.handleError('get similar movies', error);
            return { movie_id: movieId, similar_movies: [] };
        }
    }

    async getRecommendations(userId: string, limit = 10, excludeWatched = true) {
        try {
            const response = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/api/recommendations`, {
                    user_id: userId,
                    limit,
                    exclude_watched: excludeWatched,
                }).pipe(
                    timeout(3000),
                    retry({ count: 3, delay: 500 }),
                ),
            );

            const recs = response.data.recommendations || [];
            if (recs.length === 0) return { user_id: userId, recommendations: [] };

            const movieIds = recs.map((r: any) => r.movie_id);
            const movies = await this.prisma.movie.findMany({
                where: { id: { in: movieIds } },
                select: {
                    id: true,
                    title: true,
                    posterUrl: true,
                    releaseYear: true,
                    genres: { select: { genre: { select: { id: true, name: true } } } },
                },
            });

            const merged = recs.map((r: any) => {
                const details = movies.find((m: typeof movies[number]) => m.id === r.movie_id);
                return {
                    ...r,
                    id: r.movie_id,
                    ...details,
                };
            }).filter((m: any) => m.title);

            return { ...response.data, recommendations: merged };

        } catch (error) {
            this.handleError('get recommendations', error);
            return { user_id: userId, recommendations: [] };
        }
    }

    async triggerRetrain() {
        try {
            await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/api/retrain`).pipe(
                    timeout(10000), // Longer timeout for training trigger
                    retry(1),
                )
            );
            return { status: 'success' };
        } catch (error) {
            this.handleError('trigger retrain', error);
            // Don't throw for background tasks if possible, but for admin triggers maybe throw? 
            // Original code threw, let's keep throwing for admin feedback
            throw error;
        }
    }

    private handleError(context: string, error: any) {
        if (error instanceof AxiosError) {
            this.logger.warn(`Failed to ${context}: ${error.message} (Status: ${error.response?.status})`);
        } else {
            this.logger.warn(`Failed to ${context}: ${error.message}`);
        }
    }
}
