'use client';

import { useAuth } from '@/lib/auth-context';
import { useGenres, useMovies } from '@/lib/queries';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface HealthResponse {
    data?: Record<string, unknown>;
}

export default function StatusPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    // Test Data Fetching
    const { data: genres, isLoading: genresLoading, error: genresError } = useGenres();
    const { data: movies, isLoading: moviesLoading, error: moviesError } = useMovies({ limit: 1 });

    // Test System Health Endpoint
    const { data: health, isLoading: healthLoading, error: healthError } = useQuery({
        queryKey: ['health'],
        queryFn: async () => {
            const res = await api.get<HealthResponse>('/health');
            return res.data ?? {};
        },
        retry: 1
    });

    return (
        <div className="container" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
            <h1 className="text-3xl font-bold mb-8">System Status Dashboard</h1>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>

                {/* API Core Health */}
                <StatusCard
                    title="API Core & Infrastructure"
                    status={health ? 'operational' : healthLoading ? 'loading' : 'error'}
                    description="Checks connection to the Main API Service and its underlying Database & Redis connections via /health endpoint."
                    details={health ? JSON.stringify(health, null, 2) : healthError?.message || 'Failed to connect'}
                />

                {/* Auth System */}
                <StatusCard
                    title="Authentication & User System"
                    status={!authLoading ? 'operational' : 'loading'}
                    description="Verifies that the Auth Context is initializing and determining user state."
                    details={isAuthenticated
                        ? `Logged in as: ${user?.email} (${user?.role})`
                        : 'Guest User (Auth system active & ready)'}
                />

                {/* Database - Movies */}
                <StatusCard
                    title="Database Read: Movies"
                    status={movies ? 'operational' : moviesLoading ? 'loading' : 'error'}
                    description="Tests fetching movie data from PostgreSQL via Prisma."
                    details={movies
                        ? `Successfully fetched ${movies.data?.length} movies.\nTotal items in DB: ${movies.meta?.total}`
                        : moviesError?.message}
                />

                {/* Database - Genres */}
                <StatusCard
                    title="Database Read: Genres"
                    status={genres ? 'operational' : genresLoading ? 'loading' : 'error'}
                    description="Tests fetching static reference data (Genres)."
                    details={genres ? `Successfully loaded ${genres.length} genres.` : genresError?.message}
                />

            </div>
        </div>
    );
}

function StatusCard({ title, status, description, details }: { title: string, status: 'operational' | 'loading' | 'error', description: string, details?: string }) {
    let color = '#22c55e'; // Green
    if (status === 'loading') color = '#eab308'; // Yellow
    if (status === 'error') color = '#ef4444'; // Red

    return (
        <div style={{
            background: 'var(--card-bg, #1a1a1a)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid var(--border-color, #333)',
            borderTop: `4px solid ${color}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{title}</h3>
                <span style={{
                    background: status === 'operational' ? 'rgba(34, 197, 94, 0.2)' : status === 'loading' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: color,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'capitalize'
                }}>
                    {status}
                </span>
            </div>

            <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.9rem' }}>{description}</p>

            {details && (
                <div style={{
                    background: '#000',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginTop: 'auto',
                    border: '1px solid #333'
                }}>
                    <pre style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        color: '#d4d4d8',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace'
                    }}>
                        {details}
                    </pre>
                </div>
            )}
        </div>
    )
}
