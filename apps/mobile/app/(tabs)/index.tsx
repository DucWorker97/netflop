import { ScrollView, StyleSheet, RefreshControl, View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMemo, useState, useCallback } from 'react';
import { HeroBanner, HeroBannerSkeleton } from '../../src/components/HeroBanner';
import { Rail, RailSkeleton } from '../../src/components/Rail';
import { ForYouRail } from '../../src/components/ForYouRail';
import { useMovies, useGenres, useContinueWatching, useRails, RailConfig } from '../../src/hooks/queries';

export default function HomeScreen() {
    const [refreshing, setRefreshing] = useState(false);

    const { data: genresData } = useGenres();
    const { data: moviesData, isLoading, refetch } = useMovies({ limit: 50 });
    const { data: continueWatching, refetch: refetchHistory } = useContinueWatching();
    const { data: railsConfig, refetch: refetchRails } = useRails();

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetch(), refetchHistory(), refetchRails()]);
        setRefreshing(false);
    }, [refetch, refetchHistory, refetchRails]);

    const movies = moviesData?.data || [];
    const genres = genresData || [];

    // Featured movie (first one or random)
    const featuredMovie = movies[0];

    // Group movies by genre
    const moviesByGenre = useMemo(() => {
        const result: Record<string, typeof movies> = {};
        genres.forEach((genre) => {
            result[genre.id] = movies.filter((m) =>
                m.genres.some((g) => g.id === genre.id)
            );
        });
        return result;
    }, [movies, genres]);

    // Render a rail based on its type
    const renderRail = (rail: RailConfig) => {
        switch (rail.type) {
            case 'continue_watching':
                if (!continueWatching || continueWatching.length === 0) return null;
                return (
                    <Rail
                        key={rail.id}
                        title={rail.name}
                        movies={continueWatching.map((h) => h.movie)}
                    />
                );

            case 'for_you':
                return <ForYouRail key={rail.id} />;

            case 'trending':
                return (
                    <Rail
                        key={rail.id}
                        title={rail.name}
                        movies={movies.slice(0, 10)}
                    />
                );

            case 'recent':
                const recentMovies = [...movies]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10);
                return (
                    <Rail
                        key={rail.id}
                        title={rail.name}
                        movies={recentMovies}
                    />
                );

            case 'genre':
                if (!rail.genreId) return null;
                const genreMovies = moviesByGenre[rail.genreId] || [];
                if (genreMovies.length === 0) return null;
                return (
                    <Rail
                        key={rail.id}
                        title={rail.name}
                        movies={genreMovies}
                    />
                );

            default:
                return null;
        }
    };

    // Fallback rails if API returns empty
    const fallbackRails = () => (
        <>
            {continueWatching && continueWatching.length > 0 && (
                <Rail
                    title="Continue Watching"
                    movies={continueWatching.map((h) => h.movie)}
                />
            )}
            <Rail title="New & Trending" movies={movies.slice(0, 10)} />
            {genres.map((genre) => {
                const genreMovies = moviesByGenre[genre.id] || [];
                if (genreMovies.length === 0) return null;
                return (
                    <Rail key={genre.id} title={genre.name} movies={genreMovies} />
                );
            })}
        </>
    );

    if (isLoading) {
        return (
            <ScrollView style={styles.container}>
                <HeroBannerSkeleton />
                <RailSkeleton />
                <RailSkeleton />
                <RailSkeleton />
            </ScrollView>
        );
    }

    if (movies.length === 0) {
        return (
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.empty}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Text style={styles.emptyText}>No movies available</Text>
                <Text style={styles.emptySubtext}>Pull to refresh</Text>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >
            {/* Hero Banner */}
            {featuredMovie && <HeroBanner movie={featuredMovie} />}

            {/* Dynamic Rails from API */}
            {railsConfig && railsConfig.length > 0
                ? railsConfig.map((rail, index) => (
                    <Animated.View
                        key={rail.id}
                        entering={FadeInDown.delay(index * 150).springify()}
                    >
                        {renderRail(rail)}
                    </Animated.View>
                ))
                : fallbackRails()
            }
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 200,
    },
    emptyText: {
        color: '#888',
        fontSize: 18,
        marginBottom: 8,
    },
    emptySubtext: {
        color: '#555',
        fontSize: 14,
    },
});
