'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useWatchHistory } from '@/lib/queries';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';



function formatProgress(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function HistoryPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { data: history, isLoading, refetch } = useWatchHistory();
    const [clearing, setClearing] = useState(false);
    const [removingMovieId, setRemovingMovieId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    const handleClearHistory = async () => {
        if (!confirm('Are you sure you want to clear your entire watch history?')) return;

        setActionError(null);
        setClearing(true);
        try {
            await api.delete<{ data: { deleted: number } }>('/api/history');
            refetch();
        } catch (error) {
            console.error('Failed to clear history:', error);
            setActionError('Failed to clear history. Please try again.');
        } finally {
            setClearing(false);
        }
    };

    const handleRemoveHistoryItem = async (movieId: string) => {
        if (!confirm('Remove from history?')) return;

        setActionError(null);
        setRemovingMovieId(movieId);
        try {
            await api.delete<{ data: { deleted: number } }>(`/api/history/${movieId}`);
            refetch();
        } catch (error) {
            console.error('Failed to remove history item:', error);
            setActionError('Failed to remove history item. Please try again.');
        } finally {
            setRemovingMovieId(null);
        }
    };

    if (authLoading || !isAuthenticated) {
        return <div className="loading-spinner"><div className="spinner" /></div>;
    }

    return (
        <>
            <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className="section-title">Watch History</h1>
                    {history && history.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            disabled={clearing}
                            className="btn btn-secondary"
                            style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.875rem',
                                opacity: clearing ? 0.7 : 1
                            }}
                        >
                            {clearing ? 'Clearing...' : 'Clear History'}
                        </button>
                    )}
                </div>
                {actionError && (
                    <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{actionError}</p>
                )}

                {isLoading ? (
                    <div className="loading-spinner"><div className="spinner" /></div>
                ) : history?.length === 0 ? (
                    <div className="empty-state">
                        <h3>No watch history</h3>
                        <p>Start watching movies to see your history here!</p>
                        <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            Browse Movies
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {history?.map((item) => (
                            <div
                                key={item.id}
                                className="card"
                                style={{ display: 'flex', gap: '1rem', padding: '1rem', position: 'relative' }}
                            >
                                <Link href={`/movies/${item.movie.id}`} style={{ display: 'flex', gap: '1rem', flex: 1, textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ width: '120px', flexShrink: 0 }}>
                                        {item.movie.posterUrl ? (
                                            <img
                                                src={item.movie.posterUrl}
                                                alt={item.movie.title}
                                                style={{ width: '100%', borderRadius: '4px' }}
                                            />
                                        ) : (
                                            <div style={{
                                                aspectRatio: '2/3',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '2rem'
                                            }}>
                                                🎬
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ marginBottom: '0.5rem' }}>{item.movie.title}</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            Progress: {formatProgress(item.progressSeconds)}
                                            {item.completed && ' ✅ Completed'}
                                        </p>
                                        {!item.completed && (
                                            <div style={{
                                                marginTop: '0.5rem',
                                                height: '4px',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: '2px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${Math.min((item.progressSeconds / (item.movie.durationSeconds || 1)) * 100, 100)}%`,
                                                    background: 'var(--accent)'
                                                }} />
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleRemoveHistoryItem(item.movie.id);
                                    }}
                                    disabled={removingMovieId === item.movie.id}
                                    style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        background: 'none',
                                        border: 'none',
                                        color: removingMovieId === item.movie.id ? '#999' : '#666',
                                        cursor: 'pointer',
                                        fontSize: '1.25rem',
                                        padding: '0.25rem'
                                    }}
                                    title="Remove from history"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}
