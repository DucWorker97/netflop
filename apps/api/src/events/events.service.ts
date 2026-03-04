/**
 * Event Tracking Service
 * Handles event processing and queueing to Redis
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { EventType } from './dto/track-event.dto';

export interface TrackEventPayload {
    userId: string;
    eventType: EventType | string;
    movieId?: string;
    timestamp?: Date | string;
    sessionId?: string;
    platform?: string;
    properties?: Record<string, any>;
    // Video specific
    positionSeconds?: number;
    durationSeconds?: number;
    quality?: string;
    // Search specific
    query?: string;
    resultCount?: number;
    // Impression specific
    railName?: string;
    positionInRail?: number;
}

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);

    constructor(
        @InjectQueue('analytics-events') private eventsQueue: Queue,
        private prisma: PrismaService,
    ) { }

    /**
     * Track a single event - adds to queue for async processing
     */
    async trackEvent(payload: TrackEventPayload): Promise<void> {
        const event = this.normalizeEvent(payload);

        // Add to queue for async processing (non-blocking)
        await this.eventsQueue.add('process-event', event, {
            removeOnComplete: 1000,
            removeOnFail: 5000,
        });

        this.logger.debug(
            `Event queued: ${event.eventType} for user ${event.userId}`,
        );
    }

    /**
     * Track multiple events in batch
     */
    async trackBatchEvents(payloads: TrackEventPayload[]): Promise<void> {
        const events = payloads.map((p) => this.normalizeEvent(p));

        // Add all events to queue
        await this.eventsQueue.addBulk(
            events.map((event) => ({
                name: 'process-event',
                data: event,
                opts: {
                    removeOnComplete: 1000,
                    removeOnFail: 5000,
                },
            })),
        );

        this.logger.debug(`Batch queued: ${events.length} events`);
    }

    /**
     * Track video events with rate limiting consideration
     */
    async trackVideoEvent(payload: TrackEventPayload): Promise<void> {
        const event = this.normalizeEvent(payload);

        // Video events use lower priority
        await this.eventsQueue.add('process-video-event', event, {
            priority: 10, // Lower priority
            removeOnComplete: 500,
            removeOnFail: 2000,
        });
    }

    /**
     * Normalize event payload
     */
    private normalizeEvent(payload: TrackEventPayload) {
        return {
            eventId: uuidv4(),
            userId: payload.userId,
            eventType: payload.eventType,
            movieId: payload.movieId || null,
            timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
            sessionId: payload.sessionId || null,
            platform: payload.platform || 'unknown',
            properties: payload.properties || {},
            positionSeconds: payload.positionSeconds || 0,
            durationSeconds: payload.durationSeconds || 0,
            quality: payload.quality || null,
            query: payload.query || null,
            resultCount: payload.resultCount || 0,
            railName: payload.railName || null,
            positionInRail: payload.positionInRail || null,
        };
    }

    /**
     * Get recent events for a user (for debugging)
     */
    async getRecentEvents(userId: string, limit = 50) {
        // This would query from ClickHouse in production
        // For now, we just return queue stats
        const queueStats = await this.eventsQueue.getJobCounts();
        return {
            queueStats,
            message: 'Events are stored in ClickHouse analytics DB',
        };
    }

    /**
     * Record a play event directly to database for view counting
     */
    async recordPlayEvent(userId: string, movieId: string): Promise<void> {
        // Create play event record
        await this.prisma.playEvent.create({
            data: {
                userId,
                movieId,
            },
        });

        this.logger.debug(`Play event recorded: user=${userId}, movie=${movieId}`);
    }

    /**
     * Get view statistics for dashboard
     */
    async getViewStats() {
        // Total views
        const totalViews = await this.prisma.playEvent.count();

        // Views today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const viewsToday = await this.prisma.playEvent.count({
            where: {
                createdAt: { gte: today },
            },
        });

        return { totalViews, viewsToday };
    }

    /**
     * Get top movies by view count
     */
    async getTopMovies(limit = 10) {
        const topMovies = await this.prisma.playEvent.groupBy({
            by: ['movieId'],
            _count: { movieId: true },
            orderBy: { _count: { movieId: 'desc' } },
            take: limit,
        });

        // Get movie details
        const movieIds = topMovies.map((m: typeof topMovies[number]) => m.movieId);
        const movies = await this.prisma.movie.findMany({
            where: { id: { in: movieIds } },
            select: { id: true, title: true, posterUrl: true },
        });

        return topMovies.map((t: typeof topMovies[number]) => ({
            movieId: t.movieId,
            viewCount: t._count.movieId,
            movie: movies.find((m: typeof movies[number]) => m.id === t.movieId) || null,
        }));
    }

    /**
     * Get view count for a specific movie
     */
    async getMovieViewCount(movieId: string): Promise<number> {
        return this.prisma.playEvent.count({
            where: { movieId },
        });
    }
}

