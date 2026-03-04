import { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { PosterCard } from '../../src/components/PosterCard';
import { useMovies } from '../../src/hooks/queries';

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const { data, isLoading } = useMovies(
        debouncedQuery ? { q: debouncedQuery, limit: 50 } : { limit: 0 }
    );

    const movies = data?.data || [];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Search movies..."
                        placeholderTextColor="#666"
                        value={query}
                        onChangeText={setQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {query.length > 0 && (
                        <Text
                            style={styles.clearButton}
                            onPress={() => setQuery('')}
                        >
                            ✕
                        </Text>
                    )}
                </View>
            </View>

            {isLoading && debouncedQuery ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : movies.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>
                        {debouncedQuery ? 'No movies found' : 'Search for movies'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={movies}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <PosterCard movie={item} showTitle={false} />
                        </View>
                    )}
                    contentContainerStyle={styles.list}
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#fff',
    },
    clearButton: {
        fontSize: 16,
        color: '#666',
        padding: 4,
    },
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
    list: {
        padding: 16,
    },
    item: {
        flex: 1 / 3,
        marginBottom: 8,
    },
});
