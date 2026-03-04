import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfiles, useCreateProfile, Profile } from '../src/hooks/queries';
import { useCurrentProfile } from '../src/context/ProfileContext';

const AVATARS = ['👤', '👩', '👨', '👧', '👦', '🧑', '👶', '🦊', '🐱', '🐶'];

export default function ProfileSelectScreen() {
    const router = useRouter();
    const { data: profiles, isLoading } = useProfiles();
    const createProfile = useCreateProfile();
    const { setCurrentProfile } = useCurrentProfile();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');
    const [isKids, setIsKids] = useState(false);

    const handleSelectProfile = (profile: Profile) => {
        setCurrentProfile(profile);
        router.replace('/(tabs)');
    };

    const handleCreateProfile = async () => {
        if (!newProfileName.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }

        try {
            const profile = await createProfile.mutateAsync({
                name: newProfileName.trim(),
                isKids,
            });
            setShowCreateModal(false);
            setNewProfileName('');
            setIsKids(false);
            handleSelectProfile(profile);
        } catch (error) {
            Alert.alert('Error', 'Failed to create profile');
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Who's watching?</Text>

            <View style={styles.profileGrid}>
                {profiles?.map((profile) => (
                    <TouchableOpacity
                        key={profile.id}
                        style={styles.profileCard}
                        onPress={() => handleSelectProfile(profile)}
                    >
                        <View style={[styles.avatar, profile.isKids && styles.kidsAvatar]}>
                            <Text style={styles.avatarText}>
                                {profile.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.profileName}>{profile.name}</Text>
                        {profile.isKids && (
                            <Text style={styles.kidsLabel}>KIDS</Text>
                        )}
                    </TouchableOpacity>
                ))}

                {/* Add Profile Button */}
                {(profiles?.length || 0) < 5 && (
                    <TouchableOpacity
                        style={styles.profileCard}
                        onPress={() => setShowCreateModal(true)}
                    >
                        <View style={styles.addAvatar}>
                            <Text style={styles.addIcon}>+</Text>
                        </View>
                        <Text style={styles.profileName}>Add Profile</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Create Profile Modal */}
            {showCreateModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Create Profile</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Profile Name"
                            placeholderTextColor="#888"
                            value={newProfileName}
                            onChangeText={setNewProfileName}
                            maxLength={20}
                        />

                        <TouchableOpacity
                            style={styles.kidsToggle}
                            onPress={() => setIsKids(!isKids)}
                        >
                            <View style={[styles.checkbox, isKids && styles.checkboxChecked]}>
                                {isKids && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.kidsToggleText}>Kids Profile</Text>
                        </TouchableOpacity>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowCreateModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={handleCreateProfile}
                                disabled={createProfile.isPending}
                            >
                                <Text style={styles.createButtonText}>
                                    {createProfile.isPending ? 'Creating...' : 'Create'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#141414',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 40,
    },
    profileGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 20,
    },
    profileCard: {
        alignItems: 'center',
        width: 100,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    kidsAvatar: {
        backgroundColor: '#f59e0b',
    },
    avatarText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold',
    },
    profileName: {
        color: '#888',
        fontSize: 14,
    },
    kidsLabel: {
        color: '#f59e0b',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
    },
    addAvatar: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#444',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    addIcon: {
        fontSize: 40,
        color: '#444',
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modal: {
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 24,
        width: '80%',
        maxWidth: 300,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#333',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 16,
        marginBottom: 16,
    },
    kidsToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#666',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    checkmark: {
        color: '#fff',
        fontWeight: 'bold',
    },
    kidsToggleText: {
        color: '#fff',
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#444',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    createButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
