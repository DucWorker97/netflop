/**
 * Event Tracking Controller
 * Receives user behavior events and queues them for processing
 */

import {
    Controller,
    Post,
    Get,
    Body,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EventsService } from './events.service';
import { TrackEventDto, TrackBatchEventsDto } from './dto/track-event.dto';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    /**
     * Track a single event
     * POST /api/events/track
     */
    @Post('track')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.ACCEPTED)
    async trackEvent(@Request() req: any, @Body() dto: TrackEventDto) {
        await this.eventsService.trackEvent({
            ...dto,
            userId: req.user.id,
        });
        return { status: 'accepted' };
    }

    /**
     * Track multiple events in batch (for offline sync)
     * POST /api/events/track-batch
     */
    @Post('track-batch')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.ACCEPTED)
    async trackBatchEvents(@Request() req: any, @Body() dto: TrackBatchEventsDto) {
        await this.eventsService.trackBatchEvents(
            dto.events.map((e) => ({
                ...e,
                userId: req.user.id,
            })),
        );
        return { status: 'accepted', count: dto.events.length };
    }

    /**
     * Track video playback events (optimized for frequent calls)
     * POST /api/events/video
     */
    @Post('video')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.ACCEPTED)
    async trackVideoEvent(@Request() req: any, @Body() dto: TrackEventDto) {
        // Video events are rate-limited on client side (every 5 seconds)
        await this.eventsService.trackVideoEvent({
            ...dto,
            userId: req.user.id,
        });
        return { status: 'accepted' };
    }

    /**
     * Get view statistics for dashboard (admin only)
     * GET /api/events/stats
     */
    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async getStats() {
        const stats = await this.eventsService.getViewStats();
        return { data: stats };
    }

    /**
     * Get top movies by views (admin only)
     * GET /api/events/top-movies
     */
    @Get('top-movies')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async getTopMovies(@Query('limit') limit?: string) {
        const topMovies = await this.eventsService.getTopMovies(
            limit ? parseInt(limit, 10) : 10
        );
        return { data: topMovies };
    }

    /**
     * Record a play event (when user starts watching)
     * POST /api/events/play
     */
    @Post('play')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.ACCEPTED)
    async recordPlay(@Request() req: any, @Body() dto: { movieId: string }) {
        await this.eventsService.recordPlayEvent(req.user.id, dto.movieId);
        return { status: 'accepted' };
    }
}
