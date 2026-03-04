/**
 * Analytics Tracking Hook for Netflop Mobile
 * Tracks user behavior events for AI recommendations
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getAccessToken } from './auth';
import { api } from './api';

// Event types matching backend enum
export type EventType =
    // Video events
    | 'video_play'
    | 'video_pause'
    | 'video_seek'
    | 'video_complete'
    | 'video_quality_change'
    | 'video_buffer'
    // Browse events
    | 'movie_view'
    | 'movie_impression'
    | 'search'
    | 'search_result_click'
    // Engagement events
    | 'add_favorite'
    | 'remove_favorite'
    | 'rate_movie'
    // Session events
    | 'app_open'
    | 'app_close';

interface TrackEventPayload {
    eventType: EventType;
    movieId?: string;
    timestamp?: string;
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

// Generate session ID for this app session
const generateSessionId = () =>
    `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Singleton session ID
let sessionId: string | null = null;

const getSessionId = () => {
    if (!sessionId) {
        sessionId = generateSessionId();
    }
    return sessionId;
};

// Event queue for batching
let eventQueue: TrackEventPayload[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

/**
 * Hook for tracking analytics events
 */
export function useAnalytics() {
    const [token, setToken] = useState<string | null>(null);
    const appState = useRef(AppState.currentState);

    // Load token on mount
    useEffect(() => {
        getAccessToken().then(setToken);
    }, []);

    // Flush queued events
    const flushEvents = useCallback(async () => {
        if (eventQueue.length === 0 || !token) return;

        const eventsToSend = [...eventQueue];
        eventQueue = [];

        try {
            await api.post('/api/events/track-batch', { events: eventsToSend });
        } catch (error) {
            // Re-queue on failure (with limit)
            if (eventQueue.length < 100) {
                eventQueue = [...eventsToSend, ...eventQueue];
            }
            console.warn('Failed to send analytics events:', error);
        }
    }, [token]);

    // Track a single event
    const trackEvent = useCallback(
        async (payload: Omit<TrackEventPayload, 'sessionId' | 'platform'>) => {
            const event: TrackEventPayload = {
                ...payload,
                sessionId: getSessionId(),
                platform: 'mobile',
                timestamp: new Date().toISOString(),
            };

            // Add to queue
            eventQueue.push(event);

            // Debounce flush (send after 2 seconds of inactivity)
            if (flushTimeout) {
                clearTimeout(flushTimeout);
            }
            flushTimeout = setTimeout(flushEvents, 2000);

            // Force flush if queue is large
            if (eventQueue.length >= 10) {
                flushEvents();
            }
        },
        [flushEvents],
    );

    // Track video events (more frequent, sent immediately for accuracy)
    const trackVideoEvent = useCallback(
        async (
            movieId: string,
            eventType: 'video_play' | 'video_pause' | 'video_seek' | 'video_complete' | 'video_buffer',
            positionSeconds: number,
            durationSeconds: number,
            quality?: string,
        ) => {
            if (!token) return;

            try {
                await api.post(
                    '/api/events/video',
                    {
                        eventType,
                        movieId,
                        positionSeconds,
                        durationSeconds,
                        quality,
                        sessionId: getSessionId(),
                        platform: 'mobile',
                        timestamp: new Date().toISOString(),
                    }
                );
            } catch (error) {
                // Silent fail for video events to not interrupt playback
                console.debug('Video event failed:', error);
            }
        },
        [token],
    );

    // Track movie view (detail page opened)
    const trackMovieView = useCallback(
        (movieId: string) => {
            trackEvent({
                eventType: 'movie_view',
                movieId,
            });
        },
        [trackEvent],
    );

    // Track movie impression (appeared in viewport)
    const trackImpression = useCallback(
        (movieId: string, railName: string, positionInRail: number) => {
            trackEvent({
                eventType: 'movie_impression',
                movieId,
                railName,
                positionInRail,
            });
        },
        [trackEvent],
    );

    // Track search
    const trackSearch = useCallback(
        (query: string, resultCount: number) => {
            trackEvent({
                eventType: 'search',
                query,
                resultCount,
            });
        },
        [trackEvent],
    );

    // Track search result click
    const trackSearchClick = useCallback(
        (movieId: string, query: string) => {
            trackEvent({
                eventType: 'search_result_click',
                movieId,
                properties: { query },
            });
        },
        [trackEvent],
    );

    // Track favorite actions
    const trackFavorite = useCallback(
        (movieId: string, action: 'add' | 'remove') => {
            trackEvent({
                eventType: action === 'add' ? 'add_favorite' : 'remove_favorite',
                movieId,
            });
        },
        [trackEvent],
    );

    // Track rating
    const trackRating = useCallback(
        (movieId: string, rating: number) => {
            trackEvent({
                eventType: 'rate_movie',
                movieId,
                properties: { rating },
            });
        },
        [trackEvent],
    );

    // App lifecycle tracking
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App opened/resumed
                sessionId = generateSessionId(); // New session
                trackEvent({ eventType: 'app_open' });
            } else if (
                appState.current === 'active' &&
                nextAppState.match(/inactive|background/)
            ) {
                // App closed/backgrounded
                trackEvent({ eventType: 'app_close' });
                flushEvents(); // Flush before closing
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener(
            'change',
            handleAppStateChange,
        );

        // Track initial app open
        trackEvent({ eventType: 'app_open' });

        return () => {
            subscription.remove();
            flushEvents();
        };
    }, [trackEvent, flushEvents]);

    return {
        trackEvent,
        trackVideoEvent,
        trackMovieView,
        trackImpression,
        trackSearch,
        trackSearchClick,
        trackFavorite,
        trackRating,
        flushEvents,
    };
}

/**
 * Hook for video player analytics
 * Automatically tracks play/pause/seek events
 */
export function useVideoAnalytics(movieId: string, durationSeconds: number) {
    const { trackVideoEvent } = useAnalytics();
    const lastPosition = useRef(0);
    const trackingInterval = useRef<NodeJS.Timeout | null>(null);

    const onPlay = useCallback(
        (positionSeconds: number, quality?: string) => {
            trackVideoEvent(movieId, 'video_play', positionSeconds, durationSeconds, quality);
            lastPosition.current = positionSeconds;

            // Start periodic tracking (every 30 seconds)
            if (trackingInterval.current) {
                clearInterval(trackingInterval.current);
            }
            trackingInterval.current = setInterval(() => {
                // This would be updated by the player
            }, 30000);
        },
        [movieId, durationSeconds, trackVideoEvent],
    );

    const onPause = useCallback(
        (positionSeconds: number, quality?: string) => {
            trackVideoEvent(movieId, 'video_pause', positionSeconds, durationSeconds, quality);
            lastPosition.current = positionSeconds;

            if (trackingInterval.current) {
                clearInterval(trackingInterval.current);
            }
        },
        [movieId, durationSeconds, trackVideoEvent],
    );

    const onSeek = useCallback(
        (fromSeconds: number, toSeconds: number, quality?: string) => {
            trackVideoEvent(movieId, 'video_seek', toSeconds, durationSeconds, quality);
            lastPosition.current = toSeconds;
        },
        [movieId, durationSeconds, trackVideoEvent],
    );

    const onComplete = useCallback(
        (quality?: string) => {
            trackVideoEvent(movieId, 'video_complete', durationSeconds, durationSeconds, quality);

            if (trackingInterval.current) {
                clearInterval(trackingInterval.current);
            }
        },
        [movieId, durationSeconds, trackVideoEvent],
    );

    const onBuffer = useCallback(
        (positionSeconds: number) => {
            trackVideoEvent(movieId, 'video_buffer', positionSeconds, durationSeconds);
        },
        [movieId, durationSeconds, trackVideoEvent],
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (trackingInterval.current) {
                clearInterval(trackingInterval.current);
            }
        };
    }, []);

    return {
        onPlay,
        onPause,
        onSeek,
        onComplete,
        onBuffer,
    };
}
