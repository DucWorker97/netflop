import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../hooks/queries';

interface ProfileContextType {
    currentProfile: Profile | null;
    setCurrentProfile: (profile: Profile | null) => void;
    isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const CURRENT_PROFILE_KEY = 'netflop_current_profile';

export function ProfileProvider({ children }: { children: ReactNode }) {
    const [currentProfile, setCurrentProfileState] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved profile on mount
    useEffect(() => {
        loadSavedProfile();
    }, []);

    const loadSavedProfile = async () => {
        try {
            const saved = await AsyncStorage.getItem(CURRENT_PROFILE_KEY);
            if (saved) {
                setCurrentProfileState(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load saved profile:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const setCurrentProfile = async (profile: Profile | null) => {
        setCurrentProfileState(profile);
        try {
            if (profile) {
                await AsyncStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(profile));
            } else {
                await AsyncStorage.removeItem(CURRENT_PROFILE_KEY);
            }
        } catch (e) {
            console.error('Failed to save profile:', e);
        }
    };

    return (
        <ProfileContext.Provider value={{ currentProfile, setCurrentProfile, isLoading }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useCurrentProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useCurrentProfile must be used within a ProfileProvider');
    }
    return context;
}
