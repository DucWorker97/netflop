import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        const [totalUsers, totalMovies, topMovies] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.movie.count({
                where: { movieStatus: 'published' },
            }),
            this.prisma.movie.findMany({
                take: 5,
                orderBy: {
                    playEvents: {
                        _count: 'desc',
                    },
                },
                include: {
                    _count: {
                        select: { playEvents: true },
                    },
                },
            }),
        ]);

        // Views last 7 days aggregation
        // Using simple JS aggregation due to potential timezone complexities with raw SQL in simple setup
        // For scale, use $queryRaw with date_trunc
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentViews = await this.prisma.playEvent.findMany({
            where: {
                createdAt: {
                    gte: sevenDaysAgo,
                },
            },
            select: {
                createdAt: true,
            },
        });

        const viewsMap = new Map<string, number>();
        // Initialize last 7 days with 0
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            viewsMap.set(dateStr, 0);
        }

        recentViews.forEach((view) => {
            const dateStr = view.createdAt.toISOString().split('T')[0];
            if (viewsMap.has(dateStr)) {
                viewsMap.set(dateStr, (viewsMap.get(dateStr) || 0) + 1);
            }
        });

        const viewsLast7Days = Array.from(viewsMap.entries())
            .map(([date, views]) => ({ date, views }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Calculate revenue (Mock or Real)
        // Real: Sum successful payments
        const totalRevenueResult = await this.prisma.payment.aggregate({
            _sum: {
                amount: true
            },
            where: {
                status: 'SUCCESS'
            }
        });
        const totalRevenue = totalRevenueResult._sum.amount || 0;

        return {
            totalUsers,
            totalMovies,
            totalRevenue,
            viewsLast7Days,
            topMovies: topMovies.map((m) => ({
                id: m.id,
                title: m.title,
                views: m._count.playEvents,
                posterUrl: m.posterUrl
            })),
        };
    }
}
