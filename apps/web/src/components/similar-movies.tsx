'use client';

import { useSimilarMovies } from '@/lib/queries';
import { MovieRail } from './movie-rail';

export function SimilarMovies({ movieId }: { movieId: string }) {
    const { data: movies, isLoading } = useSimilarMovies(movieId);

    // Don't render anything if not loading and no movies
    if (!isLoading && (!movies || movies.length === 0)) return null;

    return (
        <MovieRail
            title="More Like This"
            movies={movies}
            isLoading={isLoading}
        />
    );
}
