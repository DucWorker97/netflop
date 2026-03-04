'use client';

import Link from 'next/link';
import { useMovies, useGenres, useViewStats, useTopMovies } from '@/lib/queries';
import { useLocalePath } from '@/lib/use-locale-path';

export default function DashboardPage() {
    const { localePath } = useLocalePath();
    const { data: moviesData, isLoading: moviesLoading } = useMovies({ limit: 100 });
    const { data: genres, isLoading: genresLoading } = useGenres();
    const { data: viewStats } = useViewStats();
    const { data: topMovies } = useTopMovies(10);

    const movies = moviesData?.data || [];
    const stats = {
        total: movies.length,
        published: movies.filter(m => m.movieStatus === 'published').length,
        draft: movies.filter(m => m.movieStatus === 'draft').length,
        ready: movies.filter(m => m.encodeStatus === 'ready').length,
        pending: movies.filter(m => m.encodeStatus === 'pending').length,
        processing: movies.filter(m => m.encodeStatus === 'processing').length,
        failed: movies.filter(m => m.encodeStatus === 'failed').length,
    };

    const recentMovies = [...movies]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

    if (moviesLoading || genresLoading) {
        return (
            <div>
                <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 100, borderRadius: 8 }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <StatCard title="Total Movies" value={stats.total} icon="🎬" />
                <StatCard title="Published" value={stats.published} icon="✅" color="#22c55e" />
                <StatCard title="Total Views" value={viewStats?.totalViews || 0} icon="👁️" color="#3b82f6" />
                <StatCard title="Views Today" value={viewStats?.viewsToday || 0} icon="📈" color="#8b5cf6" />
            </div>

            {/* Encode Status */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Encode Status</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem'
                }}>
                    <StatCard title="Ready" value={stats.ready} icon="✅" color="#22c55e" small />
                    <StatCard title="Pending" value={stats.pending} icon="⏳" color="#f59e0b" small />
                    <StatCard title="Processing" value={stats.processing} icon="⚙️" color="#3b82f6" small />
                    <StatCard title="Failed" value={stats.failed} icon="❌" color="#ef4444" small />
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Quick Actions</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link href={localePath('/movies/new')} className="btn btn-primary">
                        + New Movie
                    </Link>
                    <Link href={localePath('/movies')} className="btn btn-secondary">
                        Manage Movies
                    </Link>
                    <Link href={localePath('/genres')} className="btn btn-secondary">
                        Manage Genres
                    </Link>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                {/* Top 10 Movies */}
                <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>🔥 Top 10 Movies by Views</h2>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: 8,
                        overflow: 'hidden'
                    }}>
                        {topMovies && topMovies.length > 0 ? (
                            topMovies.map((item, index) => (
                                <Link
                                    key={item.movieId}
                                    href={localePath(`/movies/${item.movieId}`)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.75rem 1rem',
                                        borderBottom: '1px solid var(--border)',
                                        textDecoration: 'none',
                                        color: 'inherit'
                                    }}
                                >
                                    <span style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: index < 3 ? 'var(--accent)' : 'var(--bg-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {index + 1}
                                    </span>
                                    <div style={{
                                        width: 40,
                                        height: 60,
                                        borderRadius: 4,
                                        background: item.movie?.posterUrl
                                            ? `url(${item.movie.posterUrl}) center/cover`
                                            : 'var(--bg-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem'
                                    }}>
                                        {!item.movie?.posterUrl && '🎬'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500 }}>{item.movie?.title || 'Unknown'}</div>
                                    </div>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}>
                                        👁️ {item.viewCount}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No view data yet. Play some movies to see statistics!
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Movies */}
                <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recently Updated</h2>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: 8,
                        overflow: 'hidden'
                    }}>
                        {recentMovies.map(movie => (
                            <Link
                                key={movie.id}
                                href={localePath(`/movies/${movie.id}`)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.75rem 1rem',
                                    borderBottom: '1px solid var(--border)',
                                    textDecoration: 'none',
                                    color: 'inherit'
                                }}
                            >
                                <div style={{
                                    width: 40,
                                    height: 60,
                                    borderRadius: 4,
                                    background: movie.posterUrl ? `url(${movie.posterUrl}) center/cover` : 'var(--bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem'
                                }}>
                                    {!movie.posterUrl && '🎬'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500 }}>{movie.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {new Date(movie.updatedAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <span className={`badge badge-${movie.encodeStatus}`}>
                                    {movie.encodeStatus}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    color = '#fff',
    small = false
}: {
    title: string;
    value: number;
    icon: string;
    color?: string;
    small?: boolean;
}) {
    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 8,
            padding: small ? '1rem' : '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        }}>
            <div style={{ fontSize: small ? '1.5rem' : '2rem' }}>{icon}</div>
            <div>
                <div style={{
                    fontSize: small ? '1.5rem' : '2rem',
                    fontWeight: 'bold',
                    color
                }}>
                    {value}
                </div>
                <div style={{
                    fontSize: small ? '0.75rem' : '0.875rem',
                    color: 'var(--text-secondary)'
                }}>
                    {title}
                </div>
            </div>
        </div>
    );
}
