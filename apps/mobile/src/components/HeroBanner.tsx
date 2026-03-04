import { View, Text, ImageBackground, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import type { Movie } from '../hooks/queries';

const { width, height } = Dimensions.get('window');

interface HeroBannerProps {
    movie: Movie;
}

export function HeroBanner({ movie }: HeroBannerProps) {
    const router = useRouter();

    return (
        <ImageBackground
            source={{ uri: movie.posterUrl || undefined }}
            style={styles.container}
            imageStyle={styles.image}
        >
            <View style={styles.gradient} />
            <View style={styles.content}>
                <Text style={styles.title}>{movie.title}</Text>
                {movie.genres.length > 0 && (
                    <Text style={styles.genres}>
                        {movie.genres.map((g) => g.name).join(' • ')}
                    </Text>
                )}
                <View style={styles.buttons}>
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => router.push(`/player/${movie.id}`)}
                    >
                        <Text style={styles.playText}>▶ Play</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.infoButton}
                        onPress={() => router.push(`/movie/${movie.id}`)}
                    >
                        <Text style={styles.infoText}>ℹ Info</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ImageBackground>
    );
}

export function HeroBannerSkeleton() {
    return (
        <View style={[styles.container, styles.skeleton]}>
            <View style={styles.content}>
                <View style={styles.titleSkeleton} />
                <View style={styles.genresSkeleton} />
                <View style={styles.buttonsSkeleton} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width,
        height: height * 0.5,
        marginBottom: 24,
    },
    skeleton: {
        backgroundColor: '#1a1a1a',
    },
    image: {
        resizeMode: 'cover',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 16,
        paddingBottom: 24,
    },
    title: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    genres: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 16,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
    },
    playButton: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 4,
    },
    playText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    infoButton: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 4,
    },
    infoText: {
        color: '#fff',
        fontSize: 16,
    },
    titleSkeleton: {
        width: 200,
        height: 36,
        backgroundColor: '#333',
        borderRadius: 4,
        marginBottom: 8,
    },
    genresSkeleton: {
        width: 150,
        height: 16,
        backgroundColor: '#333',
        borderRadius: 4,
        marginBottom: 16,
    },
    buttonsSkeleton: {
        flexDirection: 'row',
        gap: 12,
    },
});
