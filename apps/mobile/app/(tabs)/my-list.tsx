import { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { PosterCard } from '../../src/components/PosterCard';
import { useFavorites, useRemoveFavorite } from '../../src/hooks/queries';

export default function MyListScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const { data: favorites, isLoading, refetch } = useFavorites();
    const removeMutation = useRemoveFavorite();

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const handleRemove = (movieId: string, title: string) => {
        Alert.alert(
            'Remove from My List',
            `Remove "${title}" from your list?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removeMutation.mutate(movieId),
                },
            ]
        );
    };

    if (isLoading && !favorites) {
        return (
            <View style={styles.loading}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    const items = favorites || [];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My List</Text>
            </View>

            {items.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>Your list is empty</Text>
                    <Text style={styles.emptySubtext}>
                        Add movies to your list from the home screen
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.item}
                            onLongPress={() => handleRemove(item.movieId, item.movie.title)}
                        >
                            <PosterCard movie={item.movie} showTitle={false} />
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#fff"
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
    },
    header: {
        padding: 16,
        paddingTop: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    loading: {
        flex: 1,
        backgroundColor: '#0d0d0d',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#666',
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 18,
        marginBottom: 8,
    },
    emptySubtext: {
        color: '#555',
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    list: {
        padding: 16,
    },
    item: {
        flex: 1 / 3,
        marginBottom: 8,
    },
});
