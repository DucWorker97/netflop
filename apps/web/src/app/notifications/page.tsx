'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import styles from './notifications.module.css';
import { FeatureDisabled } from '@/components/FeatureDisabled';
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { api } from '@/lib/axios';
import { useState } from 'react';

// Models matching API
interface Notification {
    id: string;
    type: 'INFO' | 'ALERT' | 'NEW_MOVIE';
    title: string;
    message: string;
    movieId?: string;
    createdAt: string; // ISO
    isRead: boolean;
}

export default function NotificationsPage() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const { data: notifications = [], isLoading } = useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data } = await api.get('/notifications');
            return data;
        },
        refetchInterval: 10000, // Poll every 10s
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    if (!FEATURE_FLAGS.notifications) {
        return <FeatureDisabled title="Notifications paused" message="Notifications will return after core features are complete." />;
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;

    const handleMarkAsRead = (id: string, isRead: boolean) => {
        if (!isRead) {
            markAsReadMutation.mutate(id);
        }
    };

    const markAllAsRead = () => {
        // Implement bulk read if API supported, for now just iterate client side or ignore unique ID rq
        // Since we only have single ID endpoint, we'll just invalidate for now or skip
        // Ideally: POST /notifications/read-all
        // For MVP, button visually clears or we loop:
        notifications.filter(n => !n.isRead).forEach(n => markAsReadMutation.mutate(n.id));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'NEW_MOVIE': return '🎬';
            case 'ALERT': return '⚠️';
            case 'INFO': return '🔔';
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

        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    if (isLoading && notifications.length === 0) {
        return <div className={styles.loading}>Loading notifications...</div>;
    }

    return (
        <div className={styles.container}>
            {/* Navbar */}
            <nav className={styles.navbar}>
                <Link href="/" className={styles.logo}>NETFLOP</Link>
                <Link href="/" className={styles.backLink}>← Back to Browse</Link>
            </nav>

            <main className={styles.main}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Notifications</h1>
                        {unreadCount > 0 && (
                            <span className={styles.unreadBadge}>{unreadCount} unread</span>
                        )}
                    </div>
                    <div className={styles.actions}>
                        {unreadCount > 0 && (
                            <button className={styles.actionBtn} onClick={markAllAsRead}>
                                Mark all as read
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className={styles.filterTabs}>
                    <button
                        className={`${styles.filterTab} ${filter === 'all' ? styles.filterActive : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`${styles.filterTab} ${filter === 'unread' ? styles.filterActive : ''}`}
                        onClick={() => setFilter('unread')}
                    >
                        Unread {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                </div>

                {/* Notifications List */}
                {filteredNotifications.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>🔔</span>
                        <h3>No notifications</h3>
                        <p>{filter === 'unread' ? "You're all caught up!" : "When there's something new, you'll see it here"}</p>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`${styles.item} ${!notification.isRead ? styles.itemUnread : ''}`}
                                onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
                            >
                                <div className={styles.icon}>{getIcon(notification.type)}</div>
                                <div className={styles.content}>
                                    <h3 className={styles.itemTitle}>{notification.title}</h3>
                                    <p className={styles.itemMessage}>{notification.message}</p>
                                    <span className={styles.time}>{formatTime(notification.createdAt)}</span>
                                </div>
                                {notification.movieId && (
                                    <Link
                                        href={`/movies/${notification.movieId}`}
                                        className={styles.viewBtn}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        View →
                                    </Link>
                                )}
                                {!notification.isRead && <div className={styles.unreadDot} />}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
