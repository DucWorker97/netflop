'use client';

import Link from 'next/link';
import styles from './coming-soon.module.css';
import { FeatureDisabled } from '@/components/FeatureDisabled';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

interface UpcomingMovie {
    id: string;
    title: string;
    posterUrl: string | null;
    releaseDate: string;
    genres: string[];
    description: string;
    notifyCount: number;
}

const mockUpcoming: UpcomingMovie[] = [
    {
        id: '1',
        title: 'Godzilla x Kong: The New Empire',
        posterUrl: null,
        releaseDate: '2024-04-12',
        genres: ['Action', 'Sci-Fi'],
        description: 'Two ancient titans, Godzilla and Kong, clash in an epic battle as humans unravel their intertwined origins.',
        notifyCount: 15420,
    },
    {
        id: '2',
        title: 'Kingdom of the Planet of the Apes',
        posterUrl: null,
        releaseDate: '2024-05-10',
        genres: ['Sci-Fi', 'Drama'],
        description: 'Many years after the reign of Caesar, a young ape goes on a journey that will lead him to question everything.',
        notifyCount: 8930,
    },
    {
        id: '3',
        title: 'Furiosa: A Mad Max Saga',
        posterUrl: null,
        releaseDate: '2024-05-24',
        genres: ['Action', 'Adventure'],
        description: 'The origin story of renegade warrior Furiosa before her encounter with Mad Max.',
        notifyCount: 12150,
    },
    {
        id: '4',
        title: 'Inside Out 2',
        posterUrl: null,
        releaseDate: '2024-06-14',
        genres: ['Animation', 'Comedy'],
        description: 'Follow Riley in her teenage years as new emotions join Joy, Sadness, and the rest.',
        notifyCount: 25600,
    },
    {
        id: '5',
        title: 'Deadpool & Wolverine',
        posterUrl: null,
        releaseDate: '2024-07-26',
        genres: ['Action', 'Comedy'],
        description: 'The Merc with a Mouth teams up with the adamantium-clawed mutant.',
        notifyCount: 42300,
    },
];

export default function ComingSoonPage() {
    if (!FEATURE_FLAGS.comingSoon) {
        return <FeatureDisabled title="Coming Soon is paused" message="This screen is temporarily disabled while we focus on core streaming." />;
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getDaysUntil = (dateStr: string) => {
        const today = new Date();
        const release = new Date(dateStr);
        const diffTime = release.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
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
                    <h1 className={styles.title}>🎬 Coming Soon</h1>
                    <p className={styles.subtitle}>Get notified when new movies are available</p>
                </div>

                {/* Movies List */}
                <div className={styles.list}>
                    {mockUpcoming.map((movie, index) => {
                        const daysUntil = getDaysUntil(movie.releaseDate);

                        return (
                            <div key={movie.id} className={styles.card}>
                                {/* Poster */}
                                <div className={styles.poster}>
                                    <span className={styles.posterLetter}>{movie.title.charAt(0)}</span>
                                    {daysUntil <= 7 && (
                                        <div className={styles.releaseBadge}>
                                            {daysUntil <= 0 ? 'Just Released!' : `${daysUntil} days`}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className={styles.content}>
                                    <div className={styles.releaseDate}>
                                        📅 {formatDate(movie.releaseDate)}
                                    </div>
                                    <h2 className={styles.movieTitle}>{movie.title}</h2>
                                    <div className={styles.genres}>
                                        {movie.genres.map(genre => (
                                            <span key={genre} className={styles.genreTag}>{genre}</span>
                                        ))}
                                    </div>
                                    <p className={styles.description}>{movie.description}</p>
                                    <div className={styles.actions}>
                                        <button className={styles.notifyBtn}>
                                            🔔 Notify Me
                                        </button>
                                        <span className={styles.notifyCount}>
                                            {movie.notifyCount.toLocaleString()} interested
                                        </span>
                                    </div>
                                </div>

                                {/* Rank */}
                                <div className={styles.rank}>#{index + 1}</div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
