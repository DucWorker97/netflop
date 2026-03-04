'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import styles from './browse-language.module.css';
import { FeatureDisabled } from '@/components/FeatureDisabled';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

interface Movie {
    id: string;
    title: string;
    posterUrl: string | null;
    audioLanguage: string;
    releaseYear: number | null;
}

const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸', region: 'Americas' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', region: 'Asia' },
    { code: 'ko', name: '한국어', flag: '🇰🇷', region: 'Asia' },
    { code: 'ja', name: '日本語', flag: '🇯🇵', region: 'Asia' },
    { code: 'zh', name: '中文', flag: '🇨🇳', region: 'Asia' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭', region: 'Asia' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', region: 'Asia' },
    { code: 'es', name: 'Español', flag: '🇪🇸', region: 'Europe' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', region: 'Europe' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', region: 'Europe' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹', region: 'Europe' },
    { code: 'pt', name: 'Português', flag: '🇧🇷', region: 'Americas' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺', region: 'Europe' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', region: 'Middle East' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷', region: 'Europe' },
];

const REGIONS = ['All', 'Asia', 'Europe', 'Americas', 'Middle East'];

export default function BrowseByLanguagePage() {
    if (!FEATURE_FLAGS.browseLanguage) {
        return <FeatureDisabled title="Browse by language paused" message="We are focusing on core playback and upload." />;
    }

    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
    const [regionFilter, setRegionFilter] = useState('All');

    const { data: movies, isLoading } = useQuery({
        queryKey: ['movies', 'language', selectedLanguage],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: '24' });
            if (selectedLanguage) params.set('language', selectedLanguage);
            const result = await api.get<{ data: Movie[] }>(`/api/movies?${params}`);
            return result.data;
        },
        enabled: !!selectedLanguage,
    });

    const filteredLanguages = LANGUAGES.filter(
        lang => regionFilter === 'All' || lang.region === regionFilter
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/" className={styles.backLink}>← Back</Link>
                <h1>Browse by Language</h1>
                <p>Explore movies and shows in different languages</p>
            </div>

            {/* Region Filter */}
            <div className={styles.regionFilter}>
                {REGIONS.map(region => (
                    <button
                        key={region}
                        className={`${styles.regionBtn} ${regionFilter === region ? styles.regionActive : ''}`}
                        onClick={() => setRegionFilter(region)}
                    >
                        {region}
                    </button>
                ))}
            </div>

            {/* Language Grid */}
            <div className={styles.languagesGrid}>
                {filteredLanguages.map(lang => (
                    <button
                        key={lang.code}
                        className={`${styles.langCard} ${selectedLanguage === lang.code ? styles.langActive : ''}`}
                        onClick={() => setSelectedLanguage(lang.code)}
                    >
                        <span className={styles.flag}>{lang.flag}</span>
                        <span className={styles.langName}>{lang.name}</span>
                    </button>
                ))}
            </div>

            {/* Movies Grid */}
            {selectedLanguage && (
                <div className={styles.moviesSection}>
                    <h2>
                        {LANGUAGES.find(l => l.code === selectedLanguage)?.flag}{' '}
                        {LANGUAGES.find(l => l.code === selectedLanguage)?.name} Movies
                    </h2>

                    {isLoading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner} />
                            <span>Loading movies...</span>
                        </div>
                    ) : movies && movies.length > 0 ? (
                        <div className={styles.moviesGrid}>
                            {movies.map(movie => (
                                <Link
                                    key={movie.id}
                                    href={`/movies/${movie.id}`}
                                    className={styles.movieCard}
                                >
                                    <img
                                        src={movie.posterUrl || '/placeholder-poster.jpg'}
                                        alt={movie.title}
                                    />
                                    <div className={styles.movieInfo}>
                                        <h3>{movie.title}</h3>
                                        <span>{movie.releaseYear}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <span>🎬</span>
                            <p>No movies available in this language yet</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
