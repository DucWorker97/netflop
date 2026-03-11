'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FeatureDisabled } from '@/components/FeatureDisabled';
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { api } from '@/lib/api';
import styles from './notifications.module.css';

interface Notification {
    id: string;
    type: 'INFO' | 'ALERT' | 'NEW_MOVIE';
    title: string;
    message: string;
    movieId: string | null;
    createdAt: string;
    isRead: boolean;
}

export default function NotificationsPage() {
    if (!FEATURE_FLAGS.notifications) {
        return (
            <FeatureDisabled
                title="Notifications paused"
                message="Notifications will return after core features are complete."
            />
        );
    }

    return <NotificationsContent />;
}

function NotificationsContent() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const { data: notifications = [], isLoading } = useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: () => api.get<Notification[]>('/api/notifications'),
        refetchInterval: 10000,
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => api.patch<Notification>(`/api/notifications/${id}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.isRead).length,
        [notifications]
    );

    const filteredNotifications = useMemo(() => {
        if (filter === 'unread') {
            return notifications.filter((notification) => !notification.isRead);
        }

        return notifications;
    }, [filter, notifications]);

    const handleMarkAsRead = (id: string, isRead: boolean) => {
        if (!isRead) {
            markAsReadMutation.mutate(id);
        }
    };

    const markAllAsRead = () => {
        notifications
            .filter((notification) => !notification.isRead)
            .forEach((notification) => markAsReadMutation.mutate(notification.id));
    };

    const getIconLabel = (type: Notification['type']) => {
        switch (type) {
            case 'NEW_MOVIE':
                return 'New';
            case 'ALERT':
                return 'Alert';
            default:
                return 'Info';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${Math.max(diffMins, 1)} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    if (isLoading && notifications.length === 0) {
        return <div className={styles.loading}>Loading notifications...</div>;
    }

    return (
        <div className={styles.container}>
            <nav className={styles.navbar}>
                <Link href="/" className={styles.logo}>NETFLOP</Link>
                <Link href="/" className={styles.backLink}>Back to Browse</Link>
            </nav>

            <main className={styles.main}>
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

                {filteredNotifications.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>Info</span>
                        <h3>No notifications</h3>
                        <p>
                            {filter === 'unread'
                                ? "You're all caught up!"
                                : "When there is something new, you'll see it here."}
                        </p>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`${styles.item} ${!notification.isRead ? styles.itemUnread : ''}`}
                                onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
                            >
                                <div className={styles.icon}>{getIconLabel(notification.type)}</div>
                                <div className={styles.content}>
                                    <h3 className={styles.itemTitle}>{notification.title}</h3>
                                    <p className={styles.itemMessage}>{notification.message}</p>
                                    <span className={styles.time}>{formatTime(notification.createdAt)}</span>
                                </div>
                                {notification.movieId && (
                                    <Link
                                        href={`/movies/${notification.movieId}`}
                                        className={styles.viewBtn}
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        View
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
