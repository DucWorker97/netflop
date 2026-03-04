import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatingsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Rate a movie (creates or updates existing rating)
     */
    async rateMovie(userId: string, movieId: string, rating: number, comment?: string | null, profileId?: string) {
        // Find existing rating
        const existing = profileId
            ? await this.prisma.rating.findUnique({
                where: { profileId_movieId: { profileId, movieId } },
            })
            : await this.prisma.rating.findFirst({
                where: { userId, movieId, profileId: null },
            });

        if (existing) {
            return this.prisma.rating.update({
                where: { id: existing.id },
                data: { rating, comment: comment !== undefined ? comment : existing.comment },
            });
        }

        return this.prisma.rating.create({
            data: {
                userId,
                profileId: profileId || null,
                movieId,
                rating,
                comment: comment || null,
            },
        });
    }

    /**
     * Get user's rating for a movie
     */
    async getUserRating(userId: string, movieId: string, profileId?: string) {
        const whereClause = profileId
            ? { profileId, movieId }
            : { userId, movieId, profileId: null };

        return this.prisma.rating.findFirst({
            where: whereClause,
        });
    }

    /**
     * Get average rating and count for a movie
     */
    async getMovieRatingStats(movieId: string) {
        const stats = await this.prisma.rating.aggregate({
            where: { movieId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        return {
            avgRating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : null,
            ratingsCount: stats._count.rating,
        };
    }

    /**
     * List recent ratings for a movie
     */
    async listMovieRatings(movieId: string, limit = 20) {
        const ratings = await this.prisma.rating.findMany({
            where: { movieId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: { select: { email: true } },
                profile: { select: { name: true } },
            },
        });

        return ratings.map((rating) => ({
            id: rating.id,
            rating: rating.rating,
            comment: rating.comment,
            createdAt: rating.createdAt.toISOString(),
            userName: rating.profile?.name || rating.user.email.split('@')[0],
        }));
    }

    /**
     * Delete a rating
     */
    async deleteRating(userId: string, movieId: string, profileId?: string) {
        const existing = profileId
            ? await this.prisma.rating.findUnique({
                where: { profileId_movieId: { profileId, movieId } },
            })
            : await this.prisma.rating.findFirst({
                where: { userId, movieId, profileId: null },
            });

        if (!existing) {
            return null;
        }

        return this.prisma.rating.delete({
            where: { id: existing.id },
        });
    }
}

