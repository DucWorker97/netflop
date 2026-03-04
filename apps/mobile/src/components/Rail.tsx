import { View, Text, FlatList, StyleSheet } from 'react-native';
import { PosterCard } from './PosterCard';
import type { Movie } from '../hooks/queries';

interface RailProps {
    title: string;
    movies: Movie[];
}

export function Rail({ title, movies }: RailProps) {
    if (movies.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <FlatList
                horizontal
                data={movies}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <PosterCard movie={item} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

export function RailSkeleton() {
    return (
        <View style={styles.container}>
            <View style={styles.titleSkeleton} />
            <View style={styles.skeletonList}>
                {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.posterSkeleton} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    list: {
        paddingHorizontal: 16,
    },
    titleSkeleton: {
        width: 120,
        height: 20,
        backgroundColor: '#1a1a1a',
        borderRadius: 4,
        marginBottom: 12,
        marginHorizontal: 16,
    },
    skeletonList: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
    },
    posterSkeleton: {
        width: 100,
        height: 150,
        backgroundColor: '#1a1a1a',
        borderRadius: 4,
    },
});
