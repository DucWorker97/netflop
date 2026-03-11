import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    AppState,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useMovie, useStreamUrl, useMovieProgress, useUpdateProgress } from '../../src/hooks/queries';
import { getS3BaseUrl, setDiagnosticsPlaybackUrl } from '../../src/lib/env';
import { fetchSubtitles, findActiveCue, SubtitleCue } from '../../src/lib/vtt-parser';
import { SubtitleOverlay } from '../../src/components/SubtitleOverlay';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width, height } = Dimensions.get('window');

export default function PlayerScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const videoRef = useRef<Video>(null);

    const [isPlaying, setIsPlaying] = useState(true);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffering, setBuffering] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [hasResumed, setHasResumed] = useState(false);
    const [showQualityModal, setShowQualityModal] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState<string>('auto');
    const [showSubtitles, setShowSubtitles] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
    const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
    const [videoKey, setVideoKey] = useState(0); // Key to force video reload

    // Refs for debouncing
    const lastSaveRef = useRef(0);
    const pendingProgressRef = useRef<{ position: number; duration: number } | null>(null);
    const savedPositionRef = useRef<number>(0); // Position to restore after quality switch

    const { data: movie } = useMovie(id);
    const {
        data: streamData,
        isLoading: streamLoading,
        error: streamError,
        refetch: refetchStream
    } = useStreamUrl(id);
    const { data: progressData } = useMovieProgress(id);
    const updateProgress = useUpdateProgress();

    // Save playback URL to diagnostics
    useEffect(() => {
        if (streamData?.playbackUrl) {
            setDiagnosticsPlaybackUrl(streamData.playbackUrl);
        }
    }, [streamData?.playbackUrl]);

    // Fetch subtitles if available
    useEffect(() => {
        if (movie?.subtitleUrl) {
            const baseUrl = getS3BaseUrl();
            const subtitleUrl = movie.subtitleUrl.startsWith('http')
                ? movie.subtitleUrl
                : `${baseUrl}/${movie.subtitleUrl}`;
            fetchSubtitles(subtitleUrl).then(setSubtitles);
        } else {
            setSubtitles([]);
        }
    }, [movie?.subtitleUrl]);

    // Get video URL based on selected quality
    const getVideoUrl = useCallback(() => {
        if (!streamData) return null;

        if (selectedQuality === 'auto') {
            return streamData.playbackUrl; // master.m3u8 for adaptive streaming
        }

        // Find the selected quality option
        const qualityOption = streamData.qualityOptions?.find(opt => opt.name === selectedQuality);
        return qualityOption?.url || streamData.playbackUrl;
    }, [streamData, selectedQuality]);

    // Handle quality change - save position and reload video
    const handleQualityChange = useCallback(async (quality: string) => {
        if (quality === selectedQuality) {
            setShowQualityModal(false);
            return;
        }

        // Save current position before switching
        savedPositionRef.current = position;

        // Update quality and force video reload
        setSelectedQuality(quality);
        setVideoKey(prev => prev + 1);
        setShowQualityModal(false);
        setBuffering(true);
    }, [selectedQuality, position]);

    // Restore position after quality switch
    useEffect(() => {
        if (savedPositionRef.current > 0 && videoRef.current && !buffering) {
            videoRef.current.setPositionAsync(savedPositionRef.current * 1000);
            savedPositionRef.current = 0;
        }
    }, [buffering, videoKey]);

    // Handle fullscreen toggle
    const toggleFullscreen = useCallback(async () => {
        if (isFullscreen) {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            setIsFullscreen(false);
        } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            setIsFullscreen(true);
        }
    }, [isFullscreen]);

    // Cleanup fullscreen on unmount
    useEffect(() => {
        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        };
    }, []);

    // Cycle playback speed
    const cycleSpeed = useCallback(() => {
        const speeds = [1.0, 1.25, 1.5, 2.0, 0.5];
        const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
        setPlaybackSpeed(speeds[nextIndex]);
    }, [playbackSpeed]);

    // Resume position (only once when video loads)
    useEffect(() => {
        if (
            progressData &&
            !progressData.completed &&
            progressData.progressSeconds > 0 &&
            progressData.durationSeconds > 0 &&
            videoRef.current &&
            !hasResumed
        ) {
            const percentComplete = progressData.progressSeconds / progressData.durationSeconds;
            // Only resume if less than 90% complete
            if (percentComplete < 0.9) {
                videoRef.current.setPositionAsync(progressData.progressSeconds * 1000);
                setHasResumed(true);
            }
        }
    }, [progressData, hasResumed]);

    // Save progress (debounced - every 5 seconds)
    const saveProgress = useCallback((positionMs: number, durationMs: number) => {
        const now = Date.now();
        const positionSeconds = Math.floor(positionMs / 1000);
        const durationSeconds = Math.floor(durationMs / 1000);

        // Update pending progress
        pendingProgressRef.current = { position: positionMs, duration: durationMs };

        // Only save every 5 seconds
        if (now - lastSaveRef.current > 5000 && durationSeconds > 0) {
            lastSaveRef.current = now;
            updateProgress.mutate({
                movieId: id,
                progressSeconds: positionSeconds,
                durationSeconds,
            });
            pendingProgressRef.current = null;
        }
    }, [id, updateProgress]);

    // Save progress on app background/exit
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            if ((state === 'background' || state === 'inactive') && pendingProgressRef.current) {
                const { position: posMs, duration: durMs } = pendingProgressRef.current;
                updateProgress.mutate({
                    movieId: id,
                    progressSeconds: Math.floor(posMs / 1000),
                    durationSeconds: Math.floor(durMs / 1000),
                });
                pendingProgressRef.current = null;
            }
        });

        return () => subscription.remove();
    }, [id, updateProgress]);

    // Save on unmount
    useEffect(() => {
        return () => {
            if (pendingProgressRef.current) {
                const { position: posMs, duration: durMs } = pendingProgressRef.current;
                updateProgress.mutate({
                    movieId: id,
                    progressSeconds: Math.floor(posMs / 1000),
                    durationSeconds: Math.floor(durMs / 1000),
                });
            }
        };
    }, []);

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) {
            if (status.error) {
                setError(`Playback error: ${status.error}`);
            }
            return;
        }

        setDuration(status.durationMillis || 0);
        setPosition(status.positionMillis || 0);
        setBuffering(status.isBuffering);
        setIsPlaying(status.isPlaying);

        // Update active subtitle
        if (showSubtitles && subtitles.length > 0) {
            const activeCue = findActiveCue(subtitles, status.positionMillis);
            setCurrentSubtitle(activeCue ? activeCue.text : null);
        } else {
            setCurrentSubtitle(null);
        }

        // Save progress (debounced)
        if (status.isPlaying) {
            const now = Date.now();
            if (now - lastSaveRef.current > 5000) {
                saveProgress(status.positionMillis, status.durationMillis || 0);
                lastSaveRef.current = now;
            }
        }
    };

    const togglePlay = async () => {
        if (videoRef.current) {
            if (isPlaying) {
                await videoRef.current.pauseAsync();
                // Save progress on pause
                if (pendingProgressRef.current) {
                    const { position: posMs, duration: durMs } = pendingProgressRef.current;
                    updateProgress.mutate({
                        movieId: id,
                        progressSeconds: Math.floor(posMs / 1000),
                        durationSeconds: Math.floor(durMs / 1000),
                    });
                    pendingProgressRef.current = null;
                }
            } else {
                await videoRef.current.playAsync();
            }
        }
    };

    const handleRetry = async () => {
        setError(null);
        await refetchStream();
    };

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const toggleControls = () => {
        setShowControls(!showControls);
    };

    // Loading state
    if (streamLoading) {
        return (
            <View style={styles.loading}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading stream...</Text>
            </View>
        );
    }

    // Error state with retry
    if (streamError || error) {
        return (
            <View style={styles.error}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>
                    {error || 'Failed to load video'}
                </Text>
                <Text style={styles.errorHint}>
                    Check your network connection and try again
                </Text>
                <View style={styles.errorButtons}>
                    <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // No stream available
    if (!streamData) {
        return (
            <View style={styles.loading}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text style={styles.loadingText}>No stream available</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <TouchableOpacity
            style={styles.container}
            activeOpacity={1}
            onPress={toggleControls}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Video */}
            <Video
                key={videoKey}
                ref={videoRef}
                source={{ uri: getVideoUrl() || '' }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={true}
                rate={playbackSpeed}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onError={(e) => setError(String(e))}
            />

            {/* Buffering overlay */}
            {buffering && (
                <View style={styles.bufferingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.bufferingText}>Buffering...</Text>
                </View>
            )}

            {/* Subtitles Overlay */}
            <SubtitleOverlay text={currentSubtitle} visible={showSubtitles && !buffering} />

            {/* Controls */}
            {showControls && (
                <View style={styles.controls}>
                    {/* Top bar */}
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.movieTitle} numberOfLines={1}>
                            {movie?.title}
                        </Text>
                        {/* Quality selector button */}
                        {streamData?.qualityOptions && streamData.qualityOptions.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setShowQualityModal(true)}
                                style={styles.qualityBtn}
                            >
                                <Text style={styles.qualityBtnText}>
                                    {selectedQuality === 'auto' ? 'AUTO' : selectedQuality}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {/* Subtitle toggle button */}
                        {movie?.subtitleUrl && (
                            <TouchableOpacity
                                onPress={() => setShowSubtitles(!showSubtitles)}
                                style={[styles.qualityBtn, showSubtitles && styles.subtitleBtnActive]}
                            >
                                <Text style={styles.qualityBtnText}>CC</Text>
                            </TouchableOpacity>
                        )}

                        {/* Speed button */}
                        <TouchableOpacity
                            onPress={cycleSpeed}
                            style={styles.qualityBtn}
                        >
                            <Text style={styles.qualityBtnText}>{playbackSpeed}x</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Center play/pause */}
                    <View style={styles.centerControls}>
                        <TouchableOpacity onPress={togglePlay} style={styles.playPauseBtn}>
                            <Text style={styles.playPauseText}>
                                {isPlaying ? '❚❚' : '▶'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bottom bar */}
                    <View style={styles.bottomBar}>
                        <Text style={styles.time}>{formatTime(position)}</Text>
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${duration > 0 ? (position / duration) * 100 : 0}%` },
                                    ]}
                                />
                            </View>
                        </View>
                        <Text style={styles.time}>{formatTime(duration)}</Text>

                        {/* Fullscreen button */}
                        <TouchableOpacity onPress={toggleFullscreen} style={styles.fullscreenBtn}>
                            <Text style={styles.fullscreenText}>
                                {isFullscreen ? '↙' : '↗'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )
            }

            {/* Quality Selection Modal */}
            {
                showQualityModal && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Quality</Text>
                            <TouchableOpacity
                                style={[
                                    styles.qualityOption,
                                    selectedQuality === 'auto' && styles.qualityOptionSelected,
                                ]}
                                onPress={() => handleQualityChange('auto')}
                            >
                                <Text style={styles.qualityOptionText}>Auto</Text>
                            </TouchableOpacity>
                            {streamData?.qualityOptions?.map((opt) => (
                                <TouchableOpacity
                                    key={opt.name}
                                    style={[
                                        styles.qualityOption,
                                        selectedQuality === opt.name && styles.qualityOptionSelected,
                                    ]}
                                    onPress={() => handleQualityChange(opt.name)}
                                >
                                    <Text style={styles.qualityOptionText}>{opt.name}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setShowQualityModal(false)}
                            >
                                <Text style={styles.modalCloseBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )
            }
        </TouchableOpacity >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loading: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#888',
        marginTop: 16,
    },
    error: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorText: {
        color: '#3b82f6',
        fontSize: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorHint: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    errorButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    retryButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#333',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
    },
    video: {
        width,
        height,
    },
    bufferingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bufferingText: {
        color: '#fff',
        marginTop: 12,
        fontSize: 14,
    },
    controls: {
        ...StyleSheet.absoluteFillObject,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    closeBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        color: '#fff',
        fontSize: 24,
    },
    movieTitle: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        marginLeft: 8,
    },
    centerControls: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playPauseBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playPauseText: {
        color: '#fff',
        fontSize: 32,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 40,
        gap: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    time: {
        color: '#fff',
        fontSize: 12,
        width: 50,
        textAlign: 'center',
    },
    progressContainer: {
        flex: 1,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 2,
    },
    qualityBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 4,
        marginLeft: 8,
    },
    qualityBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 20,
        minWidth: 200,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    qualityOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    fullscreenBtn: {
        marginLeft: 8,
        padding: 4,
    },
    fullscreenText: {
        color: '#fff',
        fontSize: 20,
    },
    qualityOptionSelected: {
        backgroundColor: '#3b82f6',
    },
    qualityOptionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    modalCloseBtn: {
        marginTop: 8,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    modalCloseBtnText: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
    },
    subtitleBtnActive: {
        backgroundColor: '#3b82f6',
    },
});
