import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import type { Movie } from '../hooks/queries';

const { width } = Dimensions.get('window');
const POSTER_WIDTH = (width - 48) / 3;
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;

interface PosterCardProps {
    movie: Movie;
    showTitle?: boolean;
}

export function PosterCard({ movie, showTitle = true }: PosterCardProps) {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => router.push(`/movie/${movie.id}`)}
            activeOpacity={0.8}
        >
            {movie.posterUrl ? (
                <Image source={{ uri: movie.posterUrl }} style={styles.poster} />
            ) : (
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>🎬</Text>
                </View>
            )}
            {showTitle && (
                <Text style={styles.title} numberOfLines={1}>
                    {movie.title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: POSTER_WIDTH,
        marginRight: 8,
    },
    poster: {
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        borderRadius: 4,
        backgroundColor: '#1a1a1a',
    },
    placeholder: {
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        borderRadius: 4,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: 32,
    },
    title: {
        color: '#ccc',
        fontSize: 12,
        marginTop: 4,
    },
});
