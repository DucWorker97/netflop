import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useMovie, useFavorites, useAddFavorite, useRemoveFavorite, useSimilarMovies } from '../../src/hooks/queries';

const { width, height } = Dimensions.get('window');

export default function MovieDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const { data: movie, isLoading, error } = useMovie(id);
    const { data: favorites } = useFavorites();
    const { data: similarMovies } = useSimilarMovies(id);
    const addFavorite = useAddFavorite();
    const removeFavorite = useRemoveFavorite();

    const isFavorite = favorites?.some((f) => f.movieId === id);

    const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null);

    const handleToggleFavorite = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isFavorite) {
            removeFavorite.mutate(id);
        } else {
            addFavorite.mutate(id);
        }
    };

    const handleRate = async (rating: 'like' | 'dislike') => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setUserRating(current => current === rating ? null : rating);
    };

    const handlePlay = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/player/${id}`);
    };

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (error || !movie) {
        return (
            <View style={styles.error}>
                <Text style={styles.errorText}>Movie not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Poster/Backdrop */}
            <View style={styles.posterContainer}>
                {movie.posterUrl ? (
                    <Image source={{ uri: movie.posterUrl }} style={styles.poster} />
                ) : (
                    <View style={[styles.poster, styles.posterPlaceholder]}>
                        <Text style={styles.placeholderText}>🎬</Text>
                    </View>
                )}
                <View style={styles.posterOverlay} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title}>{movie.title}</Text>

                {/* Meta info */}
                <View style={styles.meta}>
                    {movie.releaseYear && (
                        <Text style={styles.metaText}>{movie.releaseYear}</Text>
                    )}
                    {movie.durationSeconds && (
                        <Text style={styles.metaText}>
                            {Math.floor(movie.durationSeconds / 60)}m
                        </Text>
                    )}
                </View>

                {/* Genres */}
                {movie.genres.length > 0 && (
                    <Text style={styles.genres}>
                        {movie.genres.map((g) => g.name).join(' • ')}
                    </Text>
                )}

                {/* Buttons */}
                <View style={styles.buttons}>
                    <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
                        <Text style={styles.playText}>▶ Play</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.listButton}
                        onPress={handleToggleFavorite}
                    >
                        <Text style={styles.listText}>
                            {isFavorite ? '✓ My List' : '+ My List'}
                        </Text>
                    </TouchableOpacity>
                </View>



                {/* Actions Row */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleRate('like')}
                    >
                        <Text style={[styles.actionIcon, userRating === 'like' && styles.actionIconActive]}>👍</Text>
                        <Text style={[styles.actionText, userRating === 'like' && styles.actionTextActive]}>Like</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleRate('dislike')}
                    >
                        <Text style={[styles.actionIcon, userRating === 'dislike' && styles.actionIconActive]}>👎</Text>
                        <Text style={[styles.actionText, userRating === 'dislike' && styles.actionTextActive]}>Dislike</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionIcon}>📤</Text>
                        <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>
                </View>

                {/* Description */}
                {movie.description && (
                    <Text style={styles.description}>{movie.description}</Text>
                )}

                {/* Similar Movies */}
                {similarMovies && similarMovies.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>More Like This</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarList}>
                            {similarMovies.map((item: any) => (
                                <TouchableOpacity
                                    key={item.movie_id}
                                    style={styles.similarCard}
                                    onPress={() => router.push(`/movie/${item.movie_id}`)}
                                >
                                    {item.posterUrl ? (
                                        <Image source={{ uri: item.posterUrl }} style={styles.similarPoster} />
                                    ) : (
                                        <View style={[styles.similarPoster, styles.posterPlaceholder]}>
                                            <Text style={styles.placeholderTextSmall}>🎬</Text>
                                        </View>
                                    )}
                                    <Text style={styles.similarTitle} numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                    {item.reason && (
                                        <Text style={styles.reasonText} numberOfLines={1}>
                                            {item.reason}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
    },
    loading: {
        flex: 1,
        backgroundColor: '#0d0d0d',
        alignItems: 'center',
        justifyContent: 'center',
    },
    error: {
        flex: 1,
        backgroundColor: '#0d0d0d',
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: '#888',
        fontSize: 18,
        marginBottom: 16,
    },
    backButton: {
        padding: 12,
        backgroundColor: '#333',
        borderRadius: 8,
    },
    backText: {
        color: '#fff',
    },
    posterContainer: {
        width,
        height: height * 0.45,
        position: 'relative',
    },
    poster: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    posterPlaceholder: {
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: 64,
    },
    posterOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    content: {
        padding: 16,
        marginTop: -40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    meta: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    metaText: {
        color: '#888',
        fontSize: 14,
    },
    genres: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 16,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    playButton: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 14,
        borderRadius: 4,
        alignItems: 'center',
    },
    playText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    listButton: {
        flex: 1,
        backgroundColor: '#333',
        paddingVertical: 14,
        borderRadius: 4,
        alignItems: 'center',
    },
    listText: {
        color: '#fff',
        fontSize: 16,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    actionButton: {
        alignItems: 'center',
        gap: 4,
    },
    actionIcon: {
        fontSize: 24,
        color: '#fff',
    },
    actionIconActive: {
        color: '#3b82f6',
    },
    actionText: {
        color: '#888',
        fontSize: 12,
    },
    actionTextActive: {
        color: '#3b82f6',
    },
    description: {
        color: '#ccc',
        fontSize: 14,
        lineHeight: 22,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    similarList: {
        paddingRight: 16,
    },
    similarCard: {
        width: 120,
        marginRight: 12,
    },
    similarPoster: {
        width: 120,
        height: 180,
        borderRadius: 4,
        marginBottom: 6,
        backgroundColor: '#1a1a1a',
    },
    similarTitle: {
        color: '#ddd',
        fontSize: 12,
        fontWeight: '500',
    },
    placeholderTextSmall: {
        fontSize: 24,
    },
    reasonText: {
        color: '#3b82f6',
        fontSize: 10,
        marginTop: 2,
    },
});
