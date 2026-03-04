/**
 * Event Tracking DTOs
 */

import {
    IsString,
    IsOptional,
    IsNumber,
    IsObject,
    IsArray,
    ValidateNested,
    IsEnum,
    IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum EventType {
    // Video events
    VIDEO_PLAY = 'video_play',
    VIDEO_PAUSE = 'video_pause',
    VIDEO_SEEK = 'video_seek',
    VIDEO_COMPLETE = 'video_complete',
    VIDEO_QUALITY_CHANGE = 'video_quality_change',
    VIDEO_BUFFER = 'video_buffer',

    // Browse events
    MOVIE_VIEW = 'movie_view',
    MOVIE_IMPRESSION = 'movie_impression',
    SEARCH = 'search',
    SEARCH_RESULT_CLICK = 'search_result_click',

    // Engagement events
    ADD_FAVORITE = 'add_favorite',
    REMOVE_FAVORITE = 'remove_favorite',
    RATE_MOVIE = 'rate_movie',

    // Session events
    APP_OPEN = 'app_open',
    APP_CLOSE = 'app_close',
}

export class TrackEventDto {
    @IsEnum(EventType)
    eventType!: EventType;

    @IsOptional()
    @IsString()
    movieId?: string;

    @IsOptional()
    @IsDateString()
    timestamp?: string;

    @IsOptional()
    @IsString()
    sessionId?: string;

    @IsOptional()
    @IsString()
    platform?: string;

    @IsOptional()
    @IsObject()
    properties?: Record<string, any>;

    // Video specific
    @IsOptional()
    @IsNumber()
    positionSeconds?: number;

    @IsOptional()
    @IsNumber()
    durationSeconds?: number;

    @IsOptional()
    @IsString()
    quality?: string;

    // Search specific
    @IsOptional()
    @IsString()
    query?: string;

    @IsOptional()
    @IsNumber()
    resultCount?: number;

    // Impression specific
    @IsOptional()
    @IsString()
    railName?: string;

    @IsOptional()
    @IsNumber()
    positionInRail?: number;
}

export class TrackBatchEventsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TrackEventDto)
    events!: TrackEventDto[];
}
