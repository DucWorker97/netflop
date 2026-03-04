import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MovieStatus, EncodeStatus } from '@prisma/client';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class HistoryService {
    constructor(private prisma: PrismaService) { }

    async updateProgress(userId: string, movieId: string, dto: UpdateProgressDto, profileId?: string) {
        // Validate movie exists
        const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
        if (!movie) {
            throw new NotFoundException({
                code: 'MOVIE_NOT_FOUND',
                message: 'Movie not found',
            });
        }

        // Validate progress
        if (dto.progressSeconds < 0) {
            throw new BadRequestException({
                code: 'INVALID_PROGRESS',
                message: 'Progress cannot be negative',
            });
        }

        if (dto.durationSeconds <= 0) {
            throw new BadRequestException({
                code: 'INVALID_DURATION',
                message: 'Duration must be positive',
            });
        }

        // Allow small tolerance (±2s)
        if (dto.progressSeconds > dto.durationSeconds + 2) {
            throw new BadRequestException({
                code: 'INVALID_PROGRESS',
                message: 'Progress cannot exceed duration',
            });
        }

        // Calculate completion (90% rule)
        const completed = dto.progressSeconds >= dto.durationSeconds * 0.9;

        // Upsert watch history - use profileId if provided
        let history;
        if (profileId) {
            // Find by profile
            const existing = await this.prisma.watchHistory.findUnique({
                where: { profileId_movieId: { profileId, movieId } },
            });

            if (existing) {
                history = await this.prisma.watchHistory.update({
                    where: { id: existing.id },
                    data: {
                        progressSeconds: dto.progressSeconds,
                        durationSeconds: dto.durationSeconds,
                        completed,
                    },
                });
            } else {
                history = await this.prisma.watchHistory.create({
                    data: {
                        userId,
                        profileId,
                        movieId,
                        progressSeconds: dto.progressSeconds,
                        durationSeconds: dto.durationSeconds,
                        completed,
                    },
                });
            }
        } else {
            // Fallback: find by userId without profileId
            const existing = await this.prisma.watchHistory.findFirst({
                where: { userId, movieId, profileId: null },
            });

            if (existing) {
                history = await this.prisma.watchHistory.update({
                    where: { id: existing.id },
                    data: {
                        progressSeconds: dto.progressSeconds,
                        durationSeconds: dto.durationSeconds,
                        completed,
                    },
                });
            } else {
                history = await this.prisma.watchHistory.create({
                    data: {
                        userId,
                        movieId,
                        progressSeconds: dto.progressSeconds,
                        durationSeconds: dto.durationSeconds,
                        completed,
                    },
                });
            }
        }

        return {
            progressSeconds: history.progressSeconds,
            durationSeconds: history.durationSeconds,
            completed: history.completed,
            updatedAt: history.updatedAt.toISOString(),
        };
    }

    async findAll(userId: string, continueWatching = false, profileId?: string) {
        // Build where clause - use profileId if provided
        const baseWhere = profileId ? { profileId } : { userId };

        const where: {
            userId?: string;
            profileId?: string;
            progressSeconds?: { gt: number };
            completed?: boolean;
        } = { ...baseWhere };

        // Continue watching: progress > 0 AND not completed
        if (continueWatching) {
            where.progressSeconds = { gt: 0 };
            where.completed = false;
        }

        const histories = await this.prisma.watchHistory.findMany({
            where: {
                ...where,
                movie: {
                    movieStatus: MovieStatus.published,
                    encodeStatus: EncodeStatus.ready,
                },
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                movie: {
                    include: {
                        genres: { include: { genre: true } },
                    },
                },
            },
        });

        return histories.map((h: typeof histories[number]) => ({
            id: h.id,
            movieId: h.movieId,
            movie: {
                id: h.movie.id,
                title: h.movie.title,
                posterUrl: h.movie.posterUrl,
                durationSeconds: h.movie.durationSeconds,
                releaseYear: h.movie.releaseYear,
                genres: h.movie.genres.map((mg: typeof h.movie.genres[number]) => ({
                    id: mg.genre.id,
                    name: mg.genre.name,
                    slug: mg.genre.slug,
                })),
            },
            progressSeconds: h.progressSeconds,
            durationSeconds: h.durationSeconds,
            completed: h.completed,
            updatedAt: h.updatedAt.toISOString(),
        }));
    }

    async getMovieProgress(userId: string, movieId: string, profileId?: string) {
        const whereClause = profileId
            ? { profileId, movieId }
            : { userId, movieId, profileId: null };

        const history = await this.prisma.watchHistory.findFirst({
            where: whereClause,
        });

        if (!history) {
            return null;
        }

        return {
            progressSeconds: history.progressSeconds,
            durationSeconds: history.durationSeconds,
            completed: history.completed,
            updatedAt: history.updatedAt.toISOString(),
        };
    }
}

