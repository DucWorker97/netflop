'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useActor } from '@/lib/queries';
import styles from './actor.module.css';
import { FeatureDisabled } from '@/components/FeatureDisabled';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

export default function ActorPage() {
    if (!FEATURE_FLAGS.actor) {
        return <FeatureDisabled title="Actor profiles paused" message="Actor pages are temporarily disabled." />;
    }

    const params = useParams();
    const actorId = params.id as string;

    const { data: actor, isLoading, error } = useActor(actorId);

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    if (error || !actor) {
        return (
            <div className={styles.container}>
                <Link href="/" className={styles.backLink}>← Back</Link>
                <div className={styles.loading}>Actor not found.</div>
            </div>
        );
    }

    const totalMovies = actor.movies.length;
    const genres = Array.from(
        new Set(actor.movies.flatMap((movie) => movie.genres.map((genre) => genre.name)))
    ).slice(0, 6);

    return (
        <div className={styles.container}>
            <Link href="/" className={styles.backLink}>← Back</Link>

            <div className={styles.header}>
                <div className={styles.photo}>
                    {actor.avatarUrl ? (
                        <img src={actor.avatarUrl} alt={actor.name} />
                    ) : (
                        <div className={styles.photoPlaceholder}>
                            {actor.name.charAt(0)}
                        </div>
                    )}
                </div>

                <div className={styles.info}>
                    <h1>{actor.name}</h1>

                    <div className={styles.meta}>
                        <span>🎬 {totalMovies} movies</span>
                        {genres.length > 0 && <span>• {genres.length} genres</span>}
                    </div>

                    {genres.length > 0 && (
                        <div className={styles.genrePills}>
                            {genres.map((genre) => (
                                <span key={genre} className={styles.genrePill}>{genre}</span>
                            ))}
                        </div>
                    )}

                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>{totalMovies}</span>
                            <span className={styles.statLabel}>Movies</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>{genres.length}</span>
                            <span className={styles.statLabel}>Genres</span>
                        </div>
                    </div>
                </div>
            </div>

            <section className={styles.filmography}>
                <h2>Filmography</h2>
                {actor.movies.length === 0 ? (
                    <div className={styles.loading}>No movies linked to this actor yet.</div>
                ) : (
                    <div className={styles.moviesGrid}>
                        {actor.movies.map((movie) => (
                            <Link
                                key={movie.id}
                                href={`/movies/${movie.id}`}
                                className={styles.movieCard}
                            >
                                <div className={styles.poster}>
                                    {movie.posterUrl ? (
                                        <img src={movie.posterUrl} alt={movie.title} />
                                    ) : (
                                        <div className={styles.posterPlaceholder}>🎬</div>
                                    )}
                                </div>
                                <div className={styles.movieInfo}>
                                    <h3>{movie.title}</h3>
                                    <p>{movie.releaseYear || '-'}</p>
                                    {movie.role && <span className={styles.role}>as {movie.role}</span>}
                                    {movie.genres.length > 0 && (
                                        <div className={styles.genreTags}>
                                            {movie.genres.slice(0, 3).map((genre) => (
                                                <span key={genre.id} className={styles.genreTag}>{genre.name}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
