'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './top10.module.css';
import { FeatureDisabled } from '@/components/FeatureDisabled';
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { api } from '@/lib/api';

interface Movie {
    id: string;
    title: string;
    posterUrl: string | null;
    releaseYear: number | null;
    durationSeconds: number | null;
    voteAverage: number | null;
    popularity: number | null;
}

interface MoviesResponse {
    data: Movie[];
}

export default function Top10Page() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'week' | 'month' | 'alltime'>('week');

    useEffect(() => {
        async function fetchTop10() {
            setLoading(true);
            try {
                const periodParams = period === 'week'
                    ? 'sort=popularity&order=desc'
                    : period === 'month'
                    ? 'sort=voteAverage&order=desc'
                    : 'sort=releaseYear&order=desc';
                const res = await api.get<MoviesResponse>(`/api/movies?status=published&limit=10&${periodParams}`);
                setMovies(res.data || []);
            } catch {
                setMovies([]);
            } finally {
                setLoading(false);
            }
        }
        fetchTop10();
    }, [period]);

    if (!FEATURE_FLAGS.top10) {
        return <FeatureDisabled title="Top 10 is paused" message="We are focusing on core upload and streaming features." />;
    }

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '--';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const getRankBadge = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <nav className={styles.navbar}>
                    <Link href="/" className={styles.logo}>NETFLOP</Link>
                </nav>
                <main className={styles.main}>
                    <p style={{ color: '#888', textAlign: 'center', marginTop: '4rem' }}>Loading...</p>
                </main>
            </div>
        );
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
                        <h1 className={styles.title}>Top 10</h1>
                        <p className={styles.subtitle}>Most popular movies right now</p>
                    </div>

                    {/* Period Filter */}
                    <div className={styles.periodFilter}>
                        {(['week', 'month', 'alltime'] as const).map(p => (
                            <button
                                key={p}
                                className={`${styles.periodBtn} ${period === p ? styles.periodActive : ''}`}
                                onClick={() => setPeriod(p)}
                            >
                                {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Top 10 List */}
                <div className={styles.list}>
                    {movies.length === 0 ? (
                        <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>No movies available yet.</p>
                    ) : (
                        movies.map((movie, index) => (
                            <Link
                                key={movie.id}
                                href={`/movies/${movie.id}`}
                                className={styles.item}
                            >
                                {/* Rank */}
                                <div className={styles.rank}>
                                    {index < 3 ? (
                                        <span className={styles.medal}>{getRankBadge(index)}</span>
                                    ) : (
                                        <span className={styles.number}>{index + 1}</span>
                                    )}
                                </div>

                                {/* Poster */}
                                <div className={styles.poster}>
                                    <span className={styles.posterText}>{movie.title.charAt(0)}</span>
                                </div>

                                {/* Info */}
                                <div className={styles.info}>
                                    <h3 className={styles.movieTitle}>{movie.title}</h3>
                                    <div className={styles.meta}>
                                        <span>{movie.releaseYear ?? '--'}</span>
                                        <span className={styles.dot}>•</span>
                                        <span>{formatDuration(movie.durationSeconds)}</span>
                                        <span className={styles.dot}>•</span>
                                        <span className={styles.rating}>★ {movie.voteAverage?.toFixed(1) ?? '--'}</span>
                                    </div>
                                </div>

                                {/* Trend */}
                                <div className={styles.trend}>
                                    {index < 3 ? (
                                        <span className={styles.trendUp}>↑ Hot</span>
                                    ) : index < 7 ? (
                                        <span className={styles.trendStable}>→ Steady</span>
                                    ) : (
                                        <span className={styles.trendNew}>✨ New</span>
                                    )}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
