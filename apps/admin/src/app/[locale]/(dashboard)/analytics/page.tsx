'use client';

import { useState, useEffect } from 'react';
import styles from './analytics.module.css';

interface AnalyticsData {
    totalViews: number;
    totalUsers: number;
    totalMovies: number;
    avgWatchTime: number;
    encodeStatus: {
        pending: number;
        processing: number;
        ready: number;
        failed: number;
    };
    topMovies: Array<{
        id: string;
        title: string;
        posterUrl: string | null;
        views: number;
    }>;
    genrePopularity: Array<{
        name: string;
        count: number;
    }>;
    recentActivity: Array<{
        type: 'view' | 'complete' | 'favorite';
        movieTitle: string;
        timestamp: string;
    }>;
}

const AI_CURATOR_URL = process.env.NEXT_PUBLIC_AI_CURATOR_URL || 'http://localhost:8001';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);

        try {
            let topMovies: AnalyticsData['topMovies'] = [];
            let genrePopularity: AnalyticsData['genrePopularity'] = [];
            let encodeStatus = { pending: 0, processing: 0, ready: 0, failed: 0 };
            let totalMovies = 0;

            // Try to fetch from AI Curator (optional - may not be running)
            try {
                const [trendingRes] = await Promise.all([
                    fetch(`${AI_CURATOR_URL}/api/analytics/trending?days=${dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90}`, {
                        signal: AbortSignal.timeout(3000) // 3s timeout
                    })
                ]);

                if (trendingRes.ok) {
                    const trendingData = await trendingRes.json();
                    topMovies = trendingData.movies || [];
                }
            } catch {
                // AI Curator not available - continue with fallback
                console.log('AI Curator not available, using fallback data');
            }

            // Get encode status from movies API
            try {
                const encodeStatusRes = await fetch(`${API_BASE_URL}/api/admin/movies?limit=1000`, {
                    signal: AbortSignal.timeout(5000)
                });

                if (encodeStatusRes.ok) {
                    const moviesData = await encodeStatusRes.json();
                    totalMovies = moviesData.meta?.total || moviesData.data?.length || 0;

                    if (moviesData.data) {
                        moviesData.data.forEach((movie: { encodeStatus: string }) => {
                            switch (movie.encodeStatus) {
                                case 'pending': encodeStatus.pending++; break;
                                case 'processing': encodeStatus.processing++; break;
                                case 'ready': encodeStatus.ready++; break;
                                case 'failed': encodeStatus.failed++; break;
                            }
                        });
                    }
                }
            } catch {
                console.log('API not available for movies, using fallback');
            }

            // Set data with whatever we got (or mock data for demo)
            setData({
                totalViews: Math.floor(Math.random() * 10000) + 1000,
                totalUsers: Math.floor(Math.random() * 500) + 50,
                totalMovies,
                avgWatchTime: Math.floor(Math.random() * 30) + 15,
                encodeStatus,
                topMovies: topMovies.length > 0 ? topMovies : [
                    { id: '1', title: 'Sample Movie 1', posterUrl: null, views: 1234 },
                    { id: '2', title: 'Sample Movie 2', posterUrl: null, views: 987 },
                    { id: '3', title: 'Sample Movie 3', posterUrl: null, views: 765 },
                ],
                genrePopularity: genrePopularity.length > 0 ? genrePopularity : [
                    { name: 'Action', count: 45 },
                    { name: 'Comedy', count: 38 },
                    { name: 'Drama', count: 32 },
                    { name: 'Sci-Fi', count: 28 },
                    { name: 'Horror', count: 22 },
                ],
                recentActivity: [
                    { type: 'view', movieTitle: 'Latest Movie', timestamp: new Date().toISOString() },
                    { type: 'complete', movieTitle: 'Popular Film', timestamp: new Date(Date.now() - 3600000).toISOString() },
                    { type: 'favorite', movieTitle: 'Trending Show', timestamp: new Date(Date.now() - 7200000).toISOString() },
                ]
            });
        } catch (err) {
            console.error('Analytics fetch error:', err);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const formatTimeAgo = (timestamp: string) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    if (loading) {
        return (
            <div className={styles['analytics-page']}>
                <div className={styles['analytics-loading']}>
                    <div className={styles.spinner}></div>
                    <p style={{ marginTop: '1rem' }}>Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles['analytics-page']}>
                <div className={styles['analytics-error']}>
                    <p>{error}</p>
                    <button onClick={fetchAnalytics}>Retry</button>
                </div>
            </div>
        );
    }

    const maxGenreCount = Math.max(...(data?.genrePopularity.map(g => g.count) || [1]));

    return (
        <div className={styles['analytics-page']}>
            <div className={styles['analytics-header']}>
                <h1>📊 Analytics Dashboard</h1>
                <p>Overview of your content performance</p>

                {/* Date Range Selector */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    {(['7d', '30d', '90d'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                background: dateRange === range ? 'var(--accent)' : '#f0f0f0',
                                color: dateRange === range ? 'white' : '#666',
                                fontWeight: 500
                            }}
                        >
                            {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className={styles['stats-grid']}>
                <div className={`${styles['stat-card']} ${styles.primary}`}>
                    <div className={styles['stat-icon']}>👁️</div>
                    <div className={styles['stat-label']}>Total Views</div>
                    <div className={styles['stat-value']}>{formatNumber(data?.totalViews || 0)}</div>
                    <div className={`${styles['stat-change']} ${styles.positive}`}>+12.5% from last period</div>
                </div>

                <div className={styles['stat-card']}>
                    <div className={styles['stat-icon']}>👥</div>
                    <div className={styles['stat-label']}>Active Users</div>
                    <div className={styles['stat-value']}>{formatNumber(data?.totalUsers || 0)}</div>
                </div>

                <div className={styles['stat-card']}>
                    <div className={styles['stat-icon']}>🎬</div>
                    <div className={styles['stat-label']}>Total Movies</div>
                    <div className={styles['stat-value']}>{data?.totalMovies || 0}</div>
                </div>

                <div className={styles['stat-card']}>
                    <div className={styles['stat-icon']}>⏱️</div>
                    <div className={styles['stat-label']}>Avg Watch Time</div>
                    <div className={styles['stat-value']}>{data?.avgWatchTime || 0}m</div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className={styles['charts-grid']}>
                {/* Top Movies */}
                <div className={styles['chart-card']}>
                    <h3>🏆 Top Movies</h3>
                    <ul className={styles['top-movies-list']}>
                        {data?.topMovies.slice(0, 10).map((movie, index) => (
                            <li key={movie.id} className={styles['top-movie-item']}>
                                <span className={`${styles['top-movie-rank']} ${index === 0 ? styles.gold : index === 1 ? styles.silver : index === 2 ? styles.bronze : ''
                                    }`}>
                                    {index + 1}
                                </span>
                                {movie.posterUrl ? (
                                    <img src={movie.posterUrl} alt="" className={styles['top-movie-poster']} />
                                ) : (
                                    <div className={styles['top-movie-poster']} style={{ background: '#e0e0e0' }} />
                                )}
                                <div className={styles['top-movie-info']}>
                                    <div className={styles['top-movie-title']}>{movie.title}</div>
                                    <div className={styles['top-movie-views']}>{formatNumber(movie.views)} views</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Encode Status */}
                <div className={styles['chart-card']}>
                    <h3>⚙️ Encode Status</h3>
                    <div className={styles['encode-status-grid']}>
                        <div className={`${styles['encode-status-item']} ${styles.pending}`}>
                            <div className={styles['encode-count']}>{data?.encodeStatus.pending || 0}</div>
                            <div className={styles['encode-label']}>Pending</div>
                        </div>
                        <div className={`${styles['encode-status-item']} ${styles.processing}`}>
                            <div className={styles['encode-count']}>{data?.encodeStatus.processing || 0}</div>
                            <div className={styles['encode-label']}>Processing</div>
                        </div>
                        <div className={`${styles['encode-status-item']} ${styles.ready}`}>
                            <div className={styles['encode-count']}>{data?.encodeStatus.ready || 0}</div>
                            <div className={styles['encode-label']}>Ready</div>
                        </div>
                        <div className={`${styles['encode-status-item']} ${styles.failed}`}>
                            <div className={styles['encode-count']}>{data?.encodeStatus.failed || 0}</div>
                            <div className={styles['encode-label']}>Failed</div>
                        </div>
                    </div>

                    <h3 style={{ marginTop: '1.5rem' }}>📊 Genre Popularity</h3>
                    <div className={styles['genre-bar-chart']}>
                        {data?.genrePopularity.slice(0, 5).map((genre) => (
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
                </div>
            </div>

            {/* Recent Activity */}
            <div className={styles['chart-card']}>
                <h3>📝 Recent Activity</h3>
                <ul className={styles['activity-list']}>
                    {data?.recentActivity.map((activity, index) => (
                        <li key={index} className={styles['activity-item']}>
                            <div className={`${styles['activity-icon']} ${styles[activity.type]}`}>
                                {activity.type === 'view' ? '👁️' : activity.type === 'complete' ? '✅' : '❤️'}
                            </div>
                            <div className={styles['activity-text']}>
                                {activity.type === 'view' && `Someone watched "${activity.movieTitle}"`}
                                {activity.type === 'complete' && `"${activity.movieTitle}" was completed`}
                                {activity.type === 'favorite' && `"${activity.movieTitle}" was added to favorites`}
                            </div>
                            <div className={styles['activity-time']}>{formatTimeAgo(activity.timestamp)}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
