'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMovies, useDeleteMovie, usePublishMovie, type Movie } from '@/lib/queries';
import { useLocalePath } from '@/lib/use-locale-path';
import styles from './movies.module.css';

function StatusBadge({ status }: { status: string }) {
    const isGreen = status === 'published' || status === 'ready';
    const isRed = status === 'failed';
    const isCyan = status === 'processing' || status === 'pending';

    const badgeStyle: React.CSSProperties = isGreen
        ? { background: 'rgba(34,197,94,0.15)', color: 'var(--neon-green)', border: '1px solid rgba(34,197,94,0.3)' }
        : isRed
        ? { background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)' }
        : isCyan
        ? { background: 'rgba(6,182,212,0.15)', color: 'var(--neon-cyan)', border: '1px solid rgba(6,182,212,0.3)' }
        : { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.06)' };

    return (
        <span className="badge" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.03em', ...badgeStyle }}>
            {status}
        </span>
    );
}

function MovieRow({ movie, onDelete, onPublish }: {
    movie: Movie;
    onDelete: (id: string) => void;
    onPublish: (id: string, published: boolean) => void;
}) {
    const { localePath } = useLocalePath();
    const isPublished = movie.movieStatus === 'published';

    return (
        <tr>
            <td>
                <div className={styles.movieInfo}>
                    {movie.posterUrl ? (
                        <Image
                            src={movie.posterUrl}
                            alt=""
                            className={styles.poster}
                            width={44}
                            height={62}
                        />
                    ) : (
                        <div className={styles.posterPlaceholder}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                            </svg>
                        </div>
                    )}
                    <span className={styles.title}>{movie.title}</span>
                </div>
            </td>
            <td><StatusBadge status={movie.movieStatus} /></td>
            <td><StatusBadge status={movie.encodeStatus} /></td>
            <td className={styles.textMuted}>
                {new Date(movie.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </td>
            <td>
                <div className={styles.actions}>
                    <Link href={localePath(`/movies/${movie.id}`)} className="btn btn-ghost" style={{ borderRadius: '8px' }}>
                        Edit
                    </Link>

                    <button
                        onClick={() => onPublish(movie.id, !isPublished)}
                        className={`btn ${isPublished ? 'btn-secondary' : 'btn-success'}`}
                        style={{ borderRadius: '8px' }}
                        disabled={movie.encodeStatus !== 'ready'}
                        title={movie.encodeStatus !== 'ready' ? 'Encode must be ready to publish' : ''}
                    >
                        {isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                        onClick={() => onDelete(movie.id)}
                        className="btn btn-danger"
                        style={{ borderRadius: '8px' }}
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function MoviesPage() {
    const { localePath } = useLocalePath();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const { data, isLoading, error } = useMovies({ page, limit: 20, q: search || undefined });
    const deleteMutation = useDeleteMovie();
    const publishMutation = usePublishMovie();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this movie?')) return;
        try {
            await deleteMutation.mutateAsync(id);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Delete failed');
        }
    };

    const handlePublish = async (id: string, published: boolean) => {
        try {
            await publishMutation.mutateAsync({ id, published });
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Publish failed');
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className={styles.header}>
                <h1 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Movies</h1>
                <Link href={localePath('/movies/new')} className="gradient-btn" style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#fff' }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Movie
                </Link>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className={styles.searchForm}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search movies..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    style={{ maxWidth: 300 }}
                />
                <button type="submit" className="btn btn-secondary" style={{ borderRadius: '8px' }}>
                    Search
                </button>
                {search && (
                    <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ borderRadius: '8px' }}
                        onClick={() => { setSearch(''); setSearchInput(''); }}
                    >
                        Clear
                    </button>
                )}
            </form>

            {/* Error */}
            {error && (
                <div className={styles.error}>
                    {error instanceof Error ? error.message : 'Failed to load movies'}
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className={styles.loading}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`${styles.skeletonRow} skeleton`} />
                    ))}
                </div>
            )}

            {/* Table */}
            {!isLoading && data && (
                <>
                    {data.data.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No movies found</p>
                            <Link href={localePath('/movies/new')} className="gradient-btn" style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', display: 'inline-flex', color: '#fff', textDecoration: 'none' }}>
                                Create your first movie
                            </Link>
                        </div>
                    ) : (
                        <div className="glass-card overflow-hidden">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Movie</th>
                                        <th>Status</th>
                                        <th>Encode</th>
                                        <th>Updated</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.data.map((movie) => (
                                        <MovieRow
                                            key={movie.id}
                                            movie={movie}
                                            onDelete={handleDelete}
                                            onPublish={handlePublish}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {data.meta.totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={!data.meta.hasPrev}
                                className="btn btn-secondary"
                                style={{ borderRadius: '8px' }}
                            >
                                Previous
                            </button>
                            <span className={styles.pageInfo}>
                                Page {data.meta.page} of {data.meta.totalPages}
                            </span>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={!data.meta.hasNext}
                                className="btn btn-secondary"
                                style={{ borderRadius: '8px' }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
