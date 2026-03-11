'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useDashboardAnalytics } from '@/lib/queries';
import styles from './analytics.module.css';

function formatNumber(value: number) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatShortDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

export default function AnalyticsPage() {
    const { data, isLoading, error, refetch } = useDashboardAnalytics();

    const stats = data?.stats;
    const movies = useMemo(() => data?.movies ?? [], [data?.movies]);

    const encodeStatus = useMemo(
        () =>
            movies.reduce(
                (acc, movie) => {
                    acc[movie.encodeStatus] += 1;
                    return acc;
                },
                {
                    pending: 0,
                    processing: 0,
                    ready: 0,
                    failed: 0,
                }
            ),
        [movies]
    );

    const genrePopularity = useMemo(() => {
        const counts = new Map<string, number>();

        for (const movie of movies) {
            for (const genre of movie.genres) {
                counts.set(genre.name, (counts.get(genre.name) || 0) + 1);
            }
        }

        return Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [movies]);

    const totalViewsLast7Days = stats?.viewsLast7Days.reduce((sum, item) => sum + item.views, 0) ?? 0;
    const maxGenreCount = Math.max(...genrePopularity.map((genre) => genre.count), 1);

    if (isLoading) {
        return (
            <div className={styles['analytics-page']}>
                <div className={styles['analytics-loading']}>
                    <div className={styles.spinner}></div>
                    <p style={{ marginTop: '1rem' }}>Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className={styles['analytics-page']}>
                <div className={styles['analytics-error']}>
                    <p>{error instanceof Error ? error.message : 'Failed to load analytics data'}</p>
                    <button onClick={() => refetch()}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['analytics-page']}>
            <div className={styles['analytics-header']}>
                <h1>Analytics Dashboard</h1>
                <p>Live metrics from play events, payments, and the current catalog.</p>
            </div>

            <div className={styles['stats-grid']}>
                <div className={`${styles['stat-card']} ${styles.primary}`}>
                    <div className={styles['stat-icon']}>V</div>
                    <div className={styles['stat-label']}>Views Last 7 Days</div>
                    <div className={styles['stat-value']}>{formatNumber(totalViewsLast7Days)}</div>
                </div>

                <div className={styles['stat-card']}>
                    <div className={styles['stat-icon']}>U</div>
                    <div className={styles['stat-label']}>Total Users</div>
                    <div className={styles['stat-value']}>{formatNumber(stats.totalUsers)}</div>
                </div>

                <div className={styles['stat-card']}>
                    <div className={styles['stat-icon']}>M</div>
                    <div className={styles['stat-label']}>Published Movies</div>
                    <div className={styles['stat-value']}>{formatNumber(stats.totalMovies)}</div>
                </div>

                <div className={styles['stat-card']}>
                    <div className={styles['stat-icon']}>$</div>
                    <div className={styles['stat-label']}>Total Revenue</div>
                    <div className={styles['stat-value']}>{formatCurrency(stats.totalRevenue)}</div>
                </div>
            </div>

            <div className={styles['charts-grid']}>
                <div className={styles['chart-card']}>
                    <h3>Top Movies</h3>
                    {stats.topMovies.length === 0 ? (
                        <p>No play events recorded yet.</p>
                    ) : (
                        <ul className={styles['top-movies-list']}>
                            {stats.topMovies.map((movie, index) => (
                                <li key={movie.id} className={styles['top-movie-item']}>
                                    <span
                                        className={`${styles['top-movie-rank']} ${
                                            index === 0
                                                ? styles.gold
                                                : index === 1
                                                    ? styles.silver
                                                    : index === 2
                                                        ? styles.bronze
                                                        : ''
                                        }`}
                                    >
                                        {index + 1}
                                    </span>
                                    {movie.posterUrl ? (
                                        <Image
                                            src={movie.posterUrl}
                                            alt={movie.title}
                                            className={styles['top-movie-poster']}
                                            width={40}
                                            height={56}
                                        />
                                    ) : (
                                        <div className={styles['top-movie-poster']} />
                                    )}
                                    <div className={styles['top-movie-info']}>
                                        <div className={styles['top-movie-title']}>{movie.title}</div>
                                        <div className={styles['top-movie-views']}>
                                            {formatNumber(movie.views)} views
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className={styles['chart-card']}>
                    <h3>Encode Status</h3>
                    <div className={styles['encode-status-grid']}>
                        <div className={`${styles['encode-status-item']} ${styles.pending}`}>
                            <div className={styles['encode-count']}>{encodeStatus.pending}</div>
                            <div className={styles['encode-label']}>Pending</div>
                        </div>
                        <div className={`${styles['encode-status-item']} ${styles.processing}`}>
                            <div className={styles['encode-count']}>{encodeStatus.processing}</div>
                            <div className={styles['encode-label']}>Processing</div>
                        </div>
                        <div className={`${styles['encode-status-item']} ${styles.ready}`}>
                            <div className={styles['encode-count']}>{encodeStatus.ready}</div>
                            <div className={styles['encode-label']}>Ready</div>
                        </div>
                        <div className={`${styles['encode-status-item']} ${styles.failed}`}>
                            <div className={styles['encode-count']}>{encodeStatus.failed}</div>
                            <div className={styles['encode-label']}>Failed</div>
                        </div>
                    </div>

                    <h3 style={{ marginTop: '1.5rem' }}>Genre Coverage</h3>
                    {genrePopularity.length === 0 ? (
                        <p>No genre data available.</p>
                    ) : (
                        <div className={styles['genre-bar-chart']}>
                            {genrePopularity.map((genre) => (
                                <div key={genre.name} className={styles['genre-bar-item']}>
                                    <div className={styles['genre-bar-label']}>{genre.name}</div>
                                    <div className={styles['genre-bar-track']}>
                                        <div
                                            className={styles['genre-bar-fill']}
                                            style={{ width: `${(genre.count / maxGenreCount) * 100}%` }}
                                        />
                                    </div>
                                    <div className={styles['genre-bar-value']}>{genre.count}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles['chart-card']}>
                <h3>Views Last 7 Days</h3>
                {stats.viewsLast7Days.length === 0 ? (
                    <p>No viewing activity yet.</p>
                ) : (
                    <ul className={styles['activity-list']}>
                        {stats.viewsLast7Days.map((entry) => (
                            <li key={entry.date} className={styles['activity-item']}>
                                <div className={styles['activity-text']}>{formatShortDate(entry.date)}</div>
                                <div className={styles['activity-time']}>
                                    {formatNumber(entry.views)} views
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
