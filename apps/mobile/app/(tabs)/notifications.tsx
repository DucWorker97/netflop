'use client';

import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import Animated, { FadeInRight } from 'react-native-reanimated';
import {
    useMarkNotificationsRead,
    useNotifications,
    type NotificationItem,
} from '../../src/hooks/queries';

function getIconLabel(type: NotificationItem['type']) {
    switch (type) {
        case 'NEW_MOVIE':
            return 'N';
        case 'ALERT':
            return '!';
        default:
            return 'i';
    }
}

function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${Math.max(diffMins, 1)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export default function NotificationsScreen() {
    const router = useRouter();
    const { data: notifications = [], isLoading, isRefetching, refetch } = useNotifications();
    const markNotificationsRead = useMarkNotificationsRead();

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.isRead).length,
        [notifications]
    );

    const onRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    async function markAllAsRead() {
        const unreadIds = notifications
            .filter((notification) => !notification.isRead)
            .map((notification) => notification.id);

        if (unreadIds.length === 0) return;

        try {
            await markNotificationsRead.mutateAsync(unreadIds);
        } catch (error) {
            Alert.alert(
                'Unable to update notifications',
                error instanceof Error ? error.message : 'Please try again.'
            );
        }
    }

    async function handlePress(notification: NotificationItem) {
        if (!notification.isRead) {
            try {
                await markNotificationsRead.mutateAsync([notification.id]);
            } catch (error) {
                Alert.alert(
                    'Unable to update notification',
                    error instanceof Error ? error.message : 'Please try again.'
                );
            }
        }

        if (notification.movieId) {
            router.push(`/movie/${notification.movieId}`);
        }
    }

    const renderNotification = ({
        item,
        index,
    }: {
        item: NotificationItem;
        index: number;
    }) => (
        <Animated.View entering={FadeInRight.delay(index * 80)}>
            <TouchableOpacity
                style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
                onPress={() => handlePress(item)}
            >
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{getIconLabel(item.type)}</Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <View style={styles.content}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.message} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
                </View>
                {item.movieId && (
                    <View style={styles.arrow}>
                        <Text style={styles.arrowText}>{'>'}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && <Text style={styles.unreadLabel}>{unreadCount} unread</Text>}
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead} disabled={markNotificationsRead.isPending}>
                        <Text style={styles.actionBtn}>
                            {markNotificationsRead.isPending ? 'Marking...' : 'Mark all read'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No Notifications</Text>
                    <Text style={styles.emptyText}>
                        When there is new content or account activity, it will appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotification}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
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
    actionBtn: {
        color: '#3b82f6',
        fontSize: 14,
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
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
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
        color: '#fff',
        fontWeight: '700',
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
