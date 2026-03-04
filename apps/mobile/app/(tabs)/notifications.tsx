'use client';

import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface Notification {
    id: string;
    type: 'new_release' | 'recommendation' | 'update' | 'promo';
    title: string;
    message: string;
    movieId?: string;
    posterUrl?: string;
    createdAt: string;
    read: boolean;
}

const mockNotifications: Notification[] = [
    {
        id: '1',
        type: 'new_release',
        title: 'New Release',
        message: 'Dune: Part Two is now available! Watch the epic continuation.',
        movieId: '1',
        createdAt: new Date().toISOString(),
        read: false,
    },
    {
        id: '2',
        type: 'recommendation',
        title: 'Because You Watched Inception',
        message: 'You might enjoy Interstellar - a mind-bending space epic.',
        movieId: '2',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        read: false,
    },
    {
        id: '3',
        type: 'update',
        title: 'Continue Watching',
        message: 'You left off at 1:23:45 in The Dark Knight. Resume now?',
        movieId: '3',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        read: true,
    },
    {
        id: '4',
        type: 'promo',
        title: 'Top 10 This Week',
        message: 'Check out the most watched movies this week!',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        read: true,
    },
];

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const [refreshing, setRefreshing] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Simulate API refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const handlePress = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.movieId) {
            router.push(`/movie/${notification.movieId}`);
        }
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'new_release': return '🎬';
            case 'recommendation': return '✨';
            case 'update': return '▶️';
            case 'promo': return '🔥';
            default: return '📢';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const renderNotification = ({ item, index }: { item: Notification; index: number }) => (
        <Animated.View entering={FadeInRight.delay(index * 80)}>
            <TouchableOpacity
                style={[styles.notificationItem, !item.read && styles.unreadItem]}
                onPress={() => handlePress(item)}
            >
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{getIcon(item.type)}</Text>
                    {!item.read && <View style={styles.unreadDot} />}
                </View>
                <View style={styles.content}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                    <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
                </View>
                {item.movieId && (
                    <View style={styles.arrow}>
                        <Text style={styles.arrowText}>›</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && (
                        <Text style={styles.unreadLabel}>{unreadCount} unread</Text>
                    )}
                </View>
                {notifications.length > 0 && (
                    <View style={styles.headerActions}>
                        {unreadCount > 0 && (
                            <TouchableOpacity onPress={markAllAsRead}>
                                <Text style={styles.actionBtn}>Mark all read</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={clearAll}>
                            <Text style={[styles.actionBtn, styles.clearBtn]}>Clear all</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🔔</Text>
                    <Text style={styles.emptyTitle}>No Notifications</Text>
                    <Text style={styles.emptyText}>
                        When there's new content or updates, you'll see them here
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item.id}
                    renderItem={renderNotification}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#fff"
                        />
                    }
                    contentContainerStyle={styles.listContent}
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
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    unreadLabel: {
        color: '#3b82f6',
        fontSize: 14,
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 16,
    },
    actionBtn: {
        color: '#888',
        fontSize: 14,
    },
    clearBtn: {
        color: '#3b82f6',
    },
    listContent: {
        paddingBottom: 100,
    },
    notificationItem: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    unreadItem: {
        backgroundColor: 'rgba(229, 9, 20, 0.05)',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        position: 'relative',
    },
    icon: {
        fontSize: 22,
    },
    unreadDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#3b82f6',
        borderWidth: 2,
        borderColor: '#0d0d0d',
    },
    content: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    message: {
        color: '#aaa',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 6,
    },
    time: {
        color: '#666',
        fontSize: 12,
    },
    arrow: {
        alignSelf: 'center',
        marginLeft: 8,
    },
    arrowText: {
        color: '#666',
        fontSize: 24,
    },
    emptyState: {
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
    },
});
