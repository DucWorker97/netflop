'use client';

import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useWatchHistory, type HistoryItem } from '../../src/hooks/queries';

function formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

function formatWatchedAt(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

function getProgressPercent(item: HistoryItem) {
    if (item.durationSeconds <= 0) return 0;
    return Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100));
}

export default function HistoryScreen() {
    const router = useRouter();
    const { data: history = [], isLoading, isRefetching, refetch } = useWatchHistory();

    const onRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    const renderItem = ({ item }: { item: HistoryItem }) => {
        const progressPercent = getProgressPercent(item);
        const movieTitle = item.movie.title;

        return (
            <TouchableOpacity
                style={styles.item}
                onPress={() => router.push(`/movie/${item.movieId}`)}
            >
                <View style={styles.poster}>
                    {item.movie.posterUrl ? (
                        <Image source={{ uri: item.movie.posterUrl }} style={styles.posterImage} />
                    ) : (
                        <Text style={styles.posterLetter}>{movieTitle.charAt(0).toUpperCase()}</Text>
                    )}
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                    </View>
                </View>

                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                        {movieTitle}
                    </Text>
                    <Text style={styles.meta}>
                        {formatDuration(item.durationSeconds)} {' | '}
                        {item.completed ? 'Completed' : `${progressPercent}% watched`}
                    </Text>
                    <Text style={styles.watchedAt}>{formatWatchedAt(item.updatedAt)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading history...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Watch History</Text>
            </View>

            {history.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyTitle}>No Watch History</Text>
                    <Text style={styles.emptyText}>Movies you watch will appear here.</Text>
                    <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/')}>
                        <Text style={styles.browseBtnText}>Start Watching</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={onRefresh}
                            tintColor="#fff"
                        />
                    }
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
        paddingTop: 60,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d0d0d',
    },
    loadingText: {
        color: '#fff',
        marginTop: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    poster: {
        width: 120,
        height: 70,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    posterImage: {
        width: '100%',
        height: '100%',
    },
    posterLetter: {
        color: '#555',
        fontSize: 24,
        fontWeight: 'bold',
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#555',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
    },
    info: {
        flex: 1,
        padding: 12,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    meta: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
    },
    watchedAt: {
        color: '#666',
        fontSize: 11,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyText: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    browseBtn: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 6,
    },
    browseBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
});
