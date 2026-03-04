'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './top10.module.css';
import { FeatureDisabled } from '@/components/FeatureDisabled';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

interface Movie {
    id: string;
    title: string;
    posterUrl: string | null;
    releaseYear: number;
    duration: string;
    views: number;
    rating: number;
}

const mockTop10: Movie[] = [
    { id: '1', title: 'Dune: Part Two', posterUrl: null, releaseYear: 2024, duration: '2h 46m', views: 15000000, rating: 8.8 },
    { id: '2', title: 'Oppenheimer', posterUrl: null, releaseYear: 2023, duration: '3h 0m', views: 14500000, rating: 8.5 },
    { id: '3', title: 'The Batman', posterUrl: null, releaseYear: 2022, duration: '2h 56m', views: 13800000, rating: 8.1 },
    { id: '4', title: 'Spider-Man: No Way Home', posterUrl: null, releaseYear: 2021, duration: '2h 28m', views: 13200000, rating: 8.3 },
    { id: '5', title: 'Avatar: The Way of Water', posterUrl: null, releaseYear: 2022, duration: '3h 12m', views: 12800000, rating: 7.8 },
    { id: '6', title: 'Top Gun: Maverick', posterUrl: null, releaseYear: 2022, duration: '2h 11m', views: 12100000, rating: 8.3 },
    { id: '7', title: 'Black Panther: Wakanda Forever', posterUrl: null, releaseYear: 2022, duration: '2h 41m', views: 11500000, rating: 7.3 },
    { id: '8', title: 'The Super Mario Bros. Movie', posterUrl: null, releaseYear: 2023, duration: '1h 32m', views: 10900000, rating: 7.1 },
    { id: '9', title: 'Barbie', posterUrl: null, releaseYear: 2023, duration: '1h 54m', views: 10200000, rating: 7.0 },
    { id: '10', title: 'Guardians of the Galaxy Vol. 3', posterUrl: null, releaseYear: 2023, duration: '2h 30m', views: 9800000, rating: 8.0 },
];

export default function Top10Page() {
    if (!FEATURE_FLAGS.top10) {
        return <FeatureDisabled title="Top 10 is paused" message="We are focusing on core upload and streaming features." />;
    }

    const [period, setPeriod] = useState<'week' | 'month' | 'alltime'>('week');

    const formatViews = (views: number) => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
        return views.toString();
    };

    const getRankBadge = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

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
                        <p className={styles.subtitle}>Most watched movies right now</p>
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
                    {mockTop10.map((movie, index) => (
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
                                    <span>{movie.releaseYear}</span>
                                    <span className={styles.dot}>•</span>
                                    <span>{movie.duration}</span>
                                    <span className={styles.dot}>•</span>
                                    <span className={styles.rating}>★ {movie.rating}</span>
                                </div>
                            </div>

                            {/* Views */}
                            <div className={styles.views}>
                                <span className={styles.viewCount}>{formatViews(movie.views)}</span>
                                <span className={styles.viewLabel}>views</span>
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
                    ))}
                </div>
            </main>
        </div>
    );
}
