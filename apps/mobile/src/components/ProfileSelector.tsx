'use client';

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, FlatList } from 'react-native';
import { useProfiles, useCreateProfile, Profile } from '../hooks/queries';

interface ProfileSelectorProps {
    currentProfileId: string | null;
    onSelectProfile: (profile: Profile) => void;
}

export function ProfileSelector({ currentProfileId, onSelectProfile }: ProfileSelectorProps) {
    const { data: profiles, isLoading } = useProfiles();
    const createProfile = useCreateProfile();

    const [showModal, setShowModal] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');
    const [isKids, setIsKids] = useState(false);

    const currentProfile = profiles?.find(p => p.id === currentProfileId) || profiles?.[0];

    const handleCreateProfile = async () => {
        if (!newProfileName.trim()) return;

        try {
            const newProfile = await createProfile.mutateAsync({
                name: newProfileName.trim(),
                isKids,
            });
            setNewProfileName('');
            setIsKids(false);
            setShowModal(false);
            onSelectProfile(newProfile);
        } catch (err) {
            console.error('Failed to create profile:', err);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.currentProfile}>
                <View style={[styles.avatar, styles.avatarSkeleton]} />
            </View>
        );
    }

    return (
        <>
            <TouchableOpacity
                style={styles.currentProfile}
                onPress={() => setShowModal(true)}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {currentProfile?.name.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
                <Text style={styles.profileName} numberOfLines={1}>
                    {currentProfile?.name || 'Select Profile'}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>

            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Who's Watching?</Text>

                        <FlatList
                            data={profiles || []}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.profileList}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.profileCard,
                                        item.id === currentProfileId && styles.profileCardActive
                                    ]}
                                    onPress={() => {
                                        onSelectProfile(item);
                                        setShowModal(false);
                                    }}
                                >
                                    <View style={[styles.largeAvatar, item.isKids && styles.kidsAvatar]}>
                                        <Text style={styles.largeAvatarText}>
                                            {item.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={styles.cardName}>{item.name}</Text>
                                    {item.isKids && (
                                        <Text style={styles.kidsLabel}>Kids</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                            ListFooterComponent={
                                <TouchableOpacity
                                    style={styles.addProfileCard}
                                    onPress={() => { }}
                                >
                                    <View style={styles.addProfileIcon}>
                                        <Text style={styles.addIcon}>+</Text>
                                    </View>
                                    <Text style={styles.cardName}>Add Profile</Text>
                                </TouchableOpacity>
                            }
                        />

                        {/* Create new profile section */}
                        <View style={styles.createSection}>
                            <TextInput
                                style={styles.input}
                                placeholder="New profile name..."
                                placeholderTextColor="#666"
                                value={newProfileName}
                                onChangeText={setNewProfileName}
                            />
                            <TouchableOpacity
                                style={styles.kidsToggle}
                                onPress={() => setIsKids(!isKids)}
                            >
                                <View style={[styles.checkbox, isKids && styles.checkboxActive]}>
                                    {isKids && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={styles.kidsToggleLabel}>Kids Profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.createBtn, !newProfileName.trim() && styles.createBtnDisabled]}
                                onPress={handleCreateProfile}
                                disabled={!newProfileName.trim() || createProfile.isPending}
                            >
                                <Text style={styles.createBtnText}>
                                    {createProfile.isPending ? 'Creating...' : 'Create Profile'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setShowModal(false)}
                        >
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    currentProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarSkeleton: {
        backgroundColor: '#333',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    profileName: {
        color: '#fff',
        fontSize: 14,
        maxWidth: 100,
    },
    dropdownIcon: {
        color: '#fff',
        fontSize: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#141414',
        borderRadius: 12,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 24,
    },
    profileList: {
        paddingVertical: 16,
        gap: 16,
    },
    profileCard: {
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
    },
    profileCardActive: {
        backgroundColor: 'rgba(229, 9, 20, 0.2)',
    },
    largeAvatar: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    kidsAvatar: {
        backgroundColor: '#22c55e',
    },
    largeAvatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 32,
    },
    cardName: {
        color: '#fff',
        fontSize: 14,
    },
    kidsLabel: {
        color: '#22c55e',
        fontSize: 12,
        marginTop: 2,
    },
    addProfileCard: {
        alignItems: 'center',
        padding: 8,
    },
    addProfileIcon: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: '#666',
        borderStyle: 'dashed',
    },
    addIcon: {
        color: '#666',
        fontSize: 40,
    },
    createSection: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 16,
    },
    input: {
        backgroundColor: '#222',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        marginBottom: 12,
    },
    kidsToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#666',
        borderRadius: 4,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#22c55e',
        borderColor: '#22c55e',
    },
    checkmark: {
        color: '#fff',
        fontSize: 12,
    },
    kidsToggleLabel: {
        color: '#ccc',
        fontSize: 14,
    },
    createBtn: {
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    createBtnDisabled: {
        opacity: 0.5,
    },
    createBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    closeBtn: {
        marginTop: 16,
        padding: 12,
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#888',
        fontSize: 14,
    },
});
