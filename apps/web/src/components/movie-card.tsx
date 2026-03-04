import Link from 'next/link';
import { type Movie } from '@/lib/queries';

interface MovieCardProps {
    movie: Movie;
    progress?: number;
    onRemove?: () => void;
}

export function MovieCard({ movie, progress, onRemove }: MovieCardProps) {
    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <Link href={`/movies/${movie.id}`} className="movie-card">
                <div className="movie-poster" style={{ position: 'relative' }}>
                    {movie.posterUrl ? (
                        <img src={movie.posterUrl} alt={movie.title} />
                    ) : (
                        <div className="movie-poster-placeholder">🎬</div>
                    )}
                    {progress !== undefined && progress > 0 && (
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'rgba(255,255,255,0.3)'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${progress}%`,
                                background: 'var(--accent)',
                                transition: 'width 0.3s'
                            }} />
                        </div>
                    )}
                </div>
                <p className="movie-title">{movie.title}</p>
                {movie.releaseYear && <p className="movie-year">{movie.releaseYear}</p>}
            </Link>
            {onRemove && (
                <button
                    onClick={(e) => { e.preventDefault(); onRemove(); }}
                    style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                    }}
                >
                    ❌
                </button>
            )}
        </div>
    );
}
