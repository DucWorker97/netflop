import Link from 'next/link';
import { type Movie } from '@/lib/queries';
import { MovieCard } from './movie-card';
import { RailSkeleton } from './skeletons';

interface MovieRailProps {
    title: string;
    movies?: Movie[];
    isLoading?: boolean;
    emptyMessage?: string;
}

export function MovieRail({ title, movies, isLoading, emptyMessage }: MovieRailProps) {
    if (isLoading) {
        return <RailSkeleton count={5} />;
    }

    if (!movies || movies.length === 0) {
        if (emptyMessage) {
            return (
                <div style={{ marginBottom: '3rem' }}>
                    <div className="section-header">
                        <h2 className="section-title">{title}</h2>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>{emptyMessage}</p>
                </div>
            );
        }
        return null;
    }

    return (
        <div style={{ marginBottom: '3rem' }}>
            <div className="section-header">
                <h2 className="section-title">{title}</h2>
            </div>
            <div style={{
                display: 'flex',
                gap: '1rem',
                overflowX: 'auto',
                paddingBottom: '1rem',
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none',  /* IE 10+ */
            }}>
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none; /* Chrome/Safari */
                    }
                `}</style>
                {movies.map((movie) => (
                    <div key={movie.id} style={{ minWidth: '200px' }}>
                        <MovieCard movie={movie} />
                    </div>
                ))}
            </div>
        </div>
    );
}
