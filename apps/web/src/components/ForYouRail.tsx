'use client';

/**
 * ForYou Rail Component
 * Displays AI-powered personalized recommendations
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import styles from './ForYouRail.module.css';

interface RecommendedMovie {
    id: string;
    title: string;
    posterUrl: string | null;
    releaseYear: number | null;
    score: number | null;
    reason: string | null;
    genres: { id: string; name: string }[];
}

interface ForYouResponse {
    source: string;
    items: RecommendedMovie[];
}

async function fetchForYou(token: string | null): Promise<ForYouResponse> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/recommendations/for-you?limit=10`,
        { headers }
    );

    if (!res.ok) {
        throw new Error('Failed to fetch recommendations');
    }

    return res.json();
}

interface ForYouRailProps {
    token: string | null;
}

export function ForYouRail({ token }: ForYouRailProps) {
    const { data, isLoading, error } = useQuery<ForYouResponse>({
        queryKey: ['recommendations', 'for-you'],
        queryFn: () => fetchForYou(token),
        enabled: !!token,
        staleTime: 1000 * 60 * 5,
    });

    if (!token || isLoading) {
        return (
            <section className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>🎯 For You</h2>
                </div>
                <div className={styles.loading}>
                    <div className={styles.skeleton} />
                    <div className={styles.skeleton} />
                    <div className={styles.skeleton} />
                    <div className={styles.skeleton} />
                </div>
            </section>
        );
    }

    if (error || !data?.items?.length) {
        return null;
    }

    return (
        <section className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>🎯 For You</h2>
                {data.source === 'ai_curator' && (
                    <span className={styles.aiBadge}>AI Powered</span>
                )}
            </div>

            <div className={styles.rail}>
                {data.items.map((movie) => (
                    <Link
                        key={movie.id}
                        href={`/movies/${movie.id}`}
                        className={styles.card}
                    >
                        <div className={styles.posterWrapper}>
                            <Image
                                src={movie.posterUrl || '/placeholder-poster.jpg'}
                                alt={movie.title}
                                fill
                                sizes="150px"
                                className={styles.poster}
                            />
                            {movie.score && (
                                <div className={styles.matchBadge}>
                                    {Math.round(movie.score * 100)}% Match
                                </div>
                            )}
                        </div>
                        {movie.reason && (
                            <p className={styles.reason}>{movie.reason}</p>
                        )}
                    </Link>
                ))}
            </div>
        </section>
    );
}
