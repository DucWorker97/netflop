/**
 * Recommendations Service
 * Calls AI Curator Python service for personalized recommendations
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError, timeout } from 'rxjs';
import { AxiosError } from 'axios';

export interface RecommendationItem {
    movie_id: string;
    title: string;
    score: number;
    reason: string;
}

interface RecommendationResponse {
    user_id: string;
    recommendations: RecommendationItem[];
    algorithm: string;
}

export interface SimilarMovie {
    movie_id: string;
    similarity: number;
    genres: string[];
}

export interface TrendingMovie {
    movie_id: string;
    title: string;
    poster_url: string;
    recent_views: number;
    avg_rating: number;
}

@Injectable()
export class RecommendationsService {
    private readonly logger = new Logger(RecommendationsService.name);
    private readonly aiCuratorUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.aiCuratorUrl =
            this.configService.get('AI_CURATOR_URL') || 'http://localhost:8000';
    }

    /**
     * Get personalized recommendations for a user
     */
    async getRecommendations(
        userId: string,
        limit: number = 10,
    ): Promise<RecommendationItem[]> {
        try {
            const response = await firstValueFrom(
                this.httpService
                    .post<RecommendationResponse>(
                        `${this.aiCuratorUrl}/api/recommendations`,
                        {
                            user_id: userId,
                            limit,
                            exclude_watched: true,
                        },
                    )
                    .pipe(
                        timeout(5000),
                        catchError((error: AxiosError) => {
                            this.logger.warn(
                                `AI Curator error: ${error.message}`,
                            );
                            throw error;
                        }),
                    ),
            );

            return response.data.recommendations;
        } catch (error) {
            this.logger.warn('Falling back to simple recommendations');
            return [];
        }
    }

    /**
     * Get movies similar to a given movie
     */
    async getSimilarMovies(
        movieId: string,
        limit: number = 5,
    ): Promise<SimilarMovie[]> {
        try {
            const response = await firstValueFrom(
                this.httpService
                    .post<{ movie_id: string; similar_movies: SimilarMovie[] }>(
                        `${this.aiCuratorUrl}/api/similar-movies`,
                        { movie_id: movieId, limit },
                    )
                    .pipe(
                        timeout(5000),
                        catchError((error: AxiosError) => {
                            this.logger.warn(
                                `AI Curator similar error: ${error.message}`,
                            );
                            throw error;
                        }),
                    ),
            );

            return response.data.similar_movies;
        } catch (error) {
            return [];
        }
    }

    /**
     * Get trending movies
     */
    async getTrending(
        days: number = 7,
        limit: number = 10,
    ): Promise<TrendingMovie[]> {
        try {
            const response = await firstValueFrom(
                this.httpService
                    .get<{ trending: TrendingMovie[] }>(
                        `${this.aiCuratorUrl}/api/trending`,
                        { params: { days, limit } },
                    )
                    .pipe(
                        timeout(5000),
                        catchError((error: AxiosError) => {
                            this.logger.warn(
                                `AI Curator trending error: ${error.message}`,
                            );
                            throw error;
                        }),
                    ),
            );

            return response.data.trending;
        } catch (error) {
            return [];
        }
    }

    /**
     * Check if AI Curator service is healthy
     */
    async isHealthy(): Promise<boolean> {
        try {
            const response = await firstValueFrom(
                this.httpService
                    .get(`${this.aiCuratorUrl}/health`)
                    .pipe(timeout(2000)),
            );
            return response.data?.status === 'healthy';
        } catch (error) {
            return false;
        }
    }
}
