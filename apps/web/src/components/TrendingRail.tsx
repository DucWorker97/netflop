'use client';

import Link from 'next/link';
import styles from './TrendingRail.module.css';

interface Movie {
    id: string;
    title: string;
    posterUrl: string | null;
    viewCount?: number;
    rank?: number;
}

interface TrendingRailProps {
    movies: Movie[];
    title?: string;
    period?: 'day' | 'week';
}

export function TrendingRail({ movies, title = 'Trending Now', period = 'day' }: TrendingRailProps) {
    if (movies.length === 0) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <div className={styles.periodBadge}>
                    {period === 'day' ? 'Today' : 'This Week'}
                </div>
            </div>

            <div className={styles.rail}>
                {movies.slice(0, 10).map((movie, index) => (
                    <Link
                        key={movie.id}
                        href={`/movies/${movie.id}`}
                        className={styles.card}
                    >
                        <div className={styles.rankNumber}>{index + 1}</div>
                        <div className={styles.poster}>
                            {movie.posterUrl ? (
                                <img src={movie.posterUrl} alt={movie.title} />
                            ) : (
                                <span className={styles.fallback}>{movie.title.charAt(0)}</span>
                            )}
                        </div>
                        <div className={styles.info}>
                            <h3 className={styles.movieTitle}>{movie.title}</h3>
                            {movie.viewCount && (
                                <span className={styles.views}>
                                    🔥 {formatViews(movie.viewCount)} views
                                </span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function formatViews(count: number): string {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
}
