'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './browse.module.css';

interface Genre {
    id: string;
    name: string;
    slug: string;
    movieCount: number;
    color: string;
}

const mockGenres: Genre[] = [
    { id: '1', name: 'Action', slug: 'action', movieCount: 45, color: '#dc2626' },
    { id: '2', name: 'Comedy', slug: 'comedy', movieCount: 38, color: '#f5c518' },
    { id: '3', name: 'Drama', slug: 'drama', movieCount: 52, color: '#6366f1' },
    { id: '4', name: 'Horror', slug: 'horror', movieCount: 28, color: '#7c3aed' },
    { id: '5', name: 'Sci-Fi', slug: 'sci-fi', movieCount: 31, color: '#06b6d4' },
    { id: '6', name: 'Romance', slug: 'romance', movieCount: 25, color: '#ec4899' },
    { id: '7', name: 'Thriller', slug: 'thriller', movieCount: 35, color: '#ef4444' },
    { id: '8', name: 'Animation', slug: 'animation', movieCount: 22, color: '#22c55e' },
    { id: '9', name: 'Documentary', slug: 'documentary', movieCount: 18, color: '#84cc16' },
    { id: '10', name: 'Fantasy', slug: 'fantasy', movieCount: 29, color: '#a855f7' },
    { id: '11', name: 'Mystery', slug: 'mystery', movieCount: 20, color: '#64748b' },
    { id: '12', name: 'Adventure', slug: 'adventure', movieCount: 33, color: '#f97316' },
];

interface Movie {
    id: string;
    title: string;
    posterUrl: string | null;
    releaseYear: number;
    rating: number;
}

const mockMovies: Movie[] = [
    { id: '1', title: 'The Dark Knight', posterUrl: null, releaseYear: 2008, rating: 9.0 },
    { id: '2', title: 'Inception', posterUrl: null, releaseYear: 2010, rating: 8.8 },
    { id: '3', title: 'Interstellar', posterUrl: null, releaseYear: 2014, rating: 8.6 },
    { id: '4', title: 'Dune: Part Two', posterUrl: null, releaseYear: 2024, rating: 8.8 },
    { id: '5', title: 'Oppenheimer', posterUrl: null, releaseYear: 2023, rating: 8.5 },
    { id: '6', title: 'The Batman', posterUrl: null, releaseYear: 2022, rating: 8.1 },
];

export default function BrowsePage() {
    const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
    const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');

    return (
        <div className={styles.container}>
            {/* Navbar */}
            <nav className={styles.navbar}>
                <Link href="/" className={styles.logo}>NETFLOP</Link>
                <Link href="/" className={styles.backLink}>← Home</Link>
            </nav>

            <main className={styles.main}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>Browse by Genre</h1>
                    <p className={styles.subtitle}>Explore movies across {mockGenres.length} genres</p>
                </div>

                {/* Genre Grid */}
                <div className={styles.genreGrid}>
                    {mockGenres.map((genre) => (
                        <button
                            key={genre.id}
                            className={`${styles.genreCard} ${selectedGenre?.id === genre.id ? styles.genreCardActive : ''}`}
                            style={{ '--genre-color': genre.color } as React.CSSProperties}
                            onClick={() => setSelectedGenre(selectedGenre?.id === genre.id ? null : genre)}
                        >
                            <span className={styles.genreName}>{genre.name}</span>
                            <span className={styles.movieCount}>{genre.movieCount} movies</span>
                        </button>
                    ))}
                </div>

                {/* Selected Genre Movies */}
                {selectedGenre && (
                    <div className={styles.moviesSection}>
                        <div className={styles.sectionHeader}>
                            <h2>{selectedGenre.name} Movies</h2>
                            <div className={styles.sortOptions}>
                                <button
                                    className={`${styles.sortBtn} ${sortBy === 'popular' ? styles.sortActive : ''}`}
                                    onClick={() => setSortBy('popular')}
                                >
                                    Popular
                                </button>
                                <button
                                    className={`${styles.sortBtn} ${sortBy === 'recent' ? styles.sortActive : ''}`}
                                    onClick={() => setSortBy('recent')}
                                >
                                    Recent
                                </button>
                                <button
                                    className={`${styles.sortBtn} ${sortBy === 'rating' ? styles.sortActive : ''}`}
                                    onClick={() => setSortBy('rating')}
                                >
                                    Top Rated
                                </button>
                            </div>
                        </div>

                        <div className={styles.moviesGrid}>
                            {mockMovies.map((movie) => (
                                <Link key={movie.id} href={`/movies/${movie.id}`} className={styles.movieCard}>
                                    <div className={styles.poster}>
                                        <span className={styles.posterLetter}>{movie.title.charAt(0)}</span>
                                    </div>
                                    <div className={styles.movieInfo}>
                                        <h3>{movie.title}</h3>
                                        <div className={styles.movieMeta}>
                                            <span>{movie.releaseYear}</span>
                                            <span className={styles.rating}>★ {movie.rating}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <button className={styles.loadMore}>Load More</button>
                    </div>
                )}

                {/* Featured Genres */}
                {!selectedGenre && (
                    <div className={styles.featuredSection}>
                        <h2>🔥 Trending Genres</h2>
                        <div className={styles.trendingGenres}>
                            {mockGenres.slice(0, 4).map((genre) => (
                                <div
                                    key={genre.id}
                                    className={styles.trendingCard}
                                    style={{ '--genre-color': genre.color } as React.CSSProperties}
                                >
                                    <h3>{genre.name}</h3>
                                    <p>{genre.movieCount} movies</p>
                                    <button
                                        className={styles.exploreBtn}
                                        onClick={() => setSelectedGenre(genre)}
                                    >
                                        Explore →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
