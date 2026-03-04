/**
 * ForYou Rail Component
 * Displays AI-powered personalized recommendations
 */

import React from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { useRecommendations } from '../hooks/queries';

export function ForYouRail() {
    const router = useRouter();
    const { trackImpression } = useAnalytics();

    const { data, isLoading, error } = useRecommendations(10);

    const handleMoviePress = (movie: any) => {
        router.push(`/movie/${movie.id}`);
    };

    const handleMovieVisible = (movie: any, index: number) => {
        trackImpression(movie.id, 'For You', index);
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>🎯 For You</Text>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#3b82f6" size="small" />
                </View>
            </View>
        );
    }

    if (error || !data?.recommendations?.length) {
        return null; // Hide rail if no recommendations
    }

    const items = data.recommendations;
    const isAi = !!data.algorithm;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🎯 For You</Text>
                {isAi && (
                    <View style={styles.aiBadge}>
                        <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                )}
            </View>

            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => handleMoviePress(item)}
                        onLayout={() => handleMovieVisible(item, index)}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={{
                                uri: item.posterUrl || 'https://via.placeholder.com/120x180',
                            }}
                            style={styles.poster}
                            resizeMode="cover"
                        />
                        {item.reason && (
                            <View style={styles.reasonContainer}>
                                <Text style={styles.reason} numberOfLines={2}>
                                    {item.reason}
                                </Text>
                            </View>
                        )}
                        {item.score && (
                            <View style={styles.scoreContainer}>
                                <Text style={styles.score}>
                                    {Math.round(item.score * 100)}% Match
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    aiBadge: {
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    aiBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    loadingContainer: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    card: {
        width: 120,
        marginRight: 12,
    },
    poster: {
        width: 120,
        height: 180,
        borderRadius: 8,
        backgroundColor: '#1A1A1A',
    },
    reasonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 6,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
    reason: {
        color: '#CCCCCC',
        fontSize: 10,
        lineHeight: 14,
    },
    scoreContainer: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#46D369',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    score: {
        color: '#000000',
        fontSize: 10,
        fontWeight: '700',
    },
});
