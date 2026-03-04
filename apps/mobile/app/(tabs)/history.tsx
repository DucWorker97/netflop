'use client';

import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';

interface HistoryItem {
    id: string;
    movieId: string;
    title: string;
    posterUrl: string | null;
    watchedAt: string;
    progress: number; // 0-100
    durationSeconds: number;
}

const mockHistory: HistoryItem[] = [
    { id: '1', movieId: 'm1', title: 'Dune: Part Two', posterUrl: null, watchedAt: new Date().toISOString(), progress: 45, durationSeconds: 9960 },
    { id: '2', movieId: 'm2', title: 'Oppenheimer', posterUrl: null, watchedAt: new Date(Date.now() - 3600000).toISOString(), progress: 100, durationSeconds: 10800 },
    { id: '3', movieId: 'm3', title: 'The Batman', posterUrl: null, watchedAt: new Date(Date.now() - 86400000).toISOString(), progress: 75, durationSeconds: 10560 },
    { id: '4', movieId: 'm4', title: 'Spider-Man: No Way Home', posterUrl: null, watchedAt: new Date(Date.now() - 172800000).toISOString(), progress: 100, durationSeconds: 8880 },
];

export default function HistoryScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<HistoryItem[]>(mockHistory);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
    }, []);

    const clearHistory = () => {
        setHistory([]);
    };

    const removeItem = (id: string) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const formatWatchedAt = (dateStr: string) => {
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
    };

    const renderItem = ({ item }: { item: HistoryItem }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(`/movie/${item.movieId}`)}
        >
            <View style={styles.poster}>
                <Text style={styles.posterLetter}>{item.title.charAt(0)}</Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
                </View>
            </View>

            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.meta}>
                    {formatDuration(item.durationSeconds)} • {item.progress === 100 ? 'Completed' : `${item.progress}% watched`}
                </Text>
                <Text style={styles.watchedAt}>{formatWatchedAt(item.watchedAt)}</Text>
            </View>

            <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                <Text style={styles.removeIcon}>×</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Watch History</Text>
                {history.length > 0 && (
                    <TouchableOpacity onPress={clearHistory}>
                        <Text style={styles.clearBtn}>Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* History List */}
            {history.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>📺</Text>
                    <Text style={styles.emptyTitle}>No Watch History</Text>
                    <Text style={styles.emptyText}>Movies you watch will appear here</Text>
                    <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/')}>
                        <Text style={styles.browseBtnText}>Start Watching</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
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
    clearBtn: {
        color: '#3b82f6',
        fontSize: 14,
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
    removeBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeIcon: {
        color: '#666',
        fontSize: 24,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
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
