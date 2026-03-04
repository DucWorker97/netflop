'use client';

import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Mock downloads data (in real app, this would come from local storage/SQLite)
interface DownloadedMovie {
    id: string;
    title: string;
    posterUrl: string | null;
    durationSeconds: number;
    downloadedAt: string;
    sizeBytes: number;
    quality: '360p' | '480p' | '720p';
    progress: number; // 0-100, 100 = complete
}

const mockDownloads: DownloadedMovie[] = [
    {
        id: '1',
        title: 'The Dark Knight',
        posterUrl: null,
        durationSeconds: 9120,
        downloadedAt: new Date().toISOString(),
        sizeBytes: 1500000000,
        quality: '720p',
        progress: 100,
    },
    {
        id: '2',
        title: 'Inception',
        posterUrl: null,
        durationSeconds: 8880,
        downloadedAt: new Date(Date.now() - 86400000).toISOString(),
        sizeBytes: 1200000000,
        quality: '480p',
        progress: 65,
    },
];

export default function DownloadsScreen() {
    const router = useRouter();
    const [downloads, setDownloads] = useState<DownloadedMovie[]>(mockDownloads);
    const [editMode, setEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const formatSize = (bytes: number) => {
        const gb = bytes / (1024 * 1024 * 1024);
        if (gb >= 1) return `${gb.toFixed(1)} GB`;
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(0)} MB`;
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const totalSize = downloads.reduce((sum, d) => sum + d.sizeBytes, 0);
    const completedDownloads = downloads.filter(d => d.progress === 100);
    const inProgressDownloads = downloads.filter(d => d.progress < 100);

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const deleteSelected = () => {
        Alert.alert(
            'Delete Downloads',
            `Delete ${selectedIds.size} download(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setDownloads(prev => prev.filter(d => !selectedIds.has(d.id)));
                        setSelectedIds(new Set());
                        setEditMode(false);
                    },
                },
            ]
        );
    };

    const handlePlay = (movie: DownloadedMovie) => {
        if (movie.progress === 100) {
            router.push(`/player/${movie.id}?offline=true`);
        }
    };

    const renderDownloadItem = useCallback(({ item, index }: { item: DownloadedMovie; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100)}>
            <TouchableOpacity
                style={[styles.downloadItem, selectedIds.has(item.id) && styles.selectedItem]}
                onPress={() => editMode ? toggleSelect(item.id) : handlePlay(item)}
                onLongPress={() => {
                    setEditMode(true);
                    toggleSelect(item.id);
                }}
            >
                {/* Poster */}
                <View style={styles.poster}>
                    <Text style={styles.posterText}>{item.title.charAt(0)}</Text>
                    {item.progress < 100 && (
                        <View style={styles.progressOverlay}>
                            <View style={[styles.progressBar, { width: `${item.progress}%` }]} />
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.meta}>
                        {formatDuration(item.durationSeconds)} • {item.quality} • {formatSize(item.sizeBytes)}
                    </Text>
                    {item.progress < 100 && (
                        <Text style={styles.downloading}>Downloading... {item.progress}%</Text>
                    )}
                </View>

                {/* Actions */}
                {editMode ? (
                    <View style={[styles.checkbox, selectedIds.has(item.id) && styles.checkboxActive]}>
                        {selectedIds.has(item.id) && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                ) : (
                    <TouchableOpacity style={styles.playBtn} onPress={() => handlePlay(item)}>
                        <Text style={styles.playIcon}>{item.progress === 100 ? '▶' : '⏸'}</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </Animated.View>
    ), [editMode, selectedIds]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Downloads</Text>
                {downloads.length > 0 && (
                    <TouchableOpacity onPress={() => setEditMode(!editMode)}>
                        <Text style={styles.editBtn}>{editMode ? 'Done' : 'Edit'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Storage Info */}
            <View style={styles.storageCard}>
                <View style={styles.storageInfo}>
                    <Text style={styles.storageLabel}>Total Storage Used</Text>
                    <Text style={styles.storageValue}>{formatSize(totalSize)}</Text>
                </View>
                <View style={styles.storageBar}>
                    <View style={[styles.storageUsed, { width: '35%' }]} />
                </View>
                <Text style={styles.storageHint}>5.2 GB free on device</Text>
            </View>

            {/* Downloads List */}
            {downloads.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📥</Text>
                    <Text style={styles.emptyTitle}>No Downloads</Text>
                    <Text style={styles.emptyText}>
                        Movies you download will appear here for offline viewing
                    </Text>
                    <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/')}>
                        <Text style={styles.browseBtnText}>Browse Movies</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {inProgressDownloads.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Downloading</Text>
                            <FlatList
                                data={inProgressDownloads}
                                keyExtractor={item => item.id}
                                renderItem={renderDownloadItem}
                                scrollEnabled={false}
                            />
                        </>
                    )}

                    {completedDownloads.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Ready to Watch</Text>
                            <FlatList
                                data={completedDownloads}
                                keyExtractor={item => item.id}
                                renderItem={renderDownloadItem}
                                scrollEnabled={false}
                            />
                        </>
                    )}
                </>
            )}

            {/* Delete Selected */}
            {editMode && selectedIds.size > 0 && (
                <TouchableOpacity style={styles.deleteBar} onPress={deleteSelected}>
                    <Text style={styles.deleteText}>Delete {selectedIds.size} Download(s)</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    editBtn: {
        color: '#3b82f6',
        fontSize: 16,
    },
    storageCard: {
        marginHorizontal: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    storageInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    storageLabel: {
        color: '#888',
        fontSize: 14,
    },
    storageValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    storageBar: {
        height: 6,
        backgroundColor: '#333',
        borderRadius: 3,
        marginBottom: 8,
    },
    storageUsed: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 3,
    },
    storageHint: {
        color: '#666',
        fontSize: 12,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        paddingHorizontal: 16,
        marginBottom: 12,
        marginTop: 8,
    },
    downloadItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    selectedItem: {
        backgroundColor: 'rgba(229, 9, 20, 0.1)',
    },
    poster: {
        width: 100,
        height: 60,
        borderRadius: 6,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    posterText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    progressOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#555',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#3b82f6',
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    meta: {
        color: '#888',
        fontSize: 13,
    },
    downloading: {
        color: '#3b82f6',
        fontSize: 12,
        marginTop: 4,
    },
    playBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playIcon: {
        color: '#000',
        fontSize: 16,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#666',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyText: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    browseBtn: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 6,
    },
    browseBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    deleteBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#3b82f6',
        padding: 16,
        alignItems: 'center',
    },
    deleteText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
