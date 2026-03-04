'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import styles from './parental-controls.module.css';

type MaturityRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';

interface Profile {
    id: string;
    name: string;
    isKids: boolean;
    pinEnabled: boolean;
    maxRating: MaturityRating;
    avatarUrl: string | null;
}

const MATURITY_RATINGS: { value: MaturityRating; label: string; description: string }[] = [
    { value: 'G', label: 'G', description: 'All ages' },
    { value: 'PG', label: 'PG', description: 'Parental guidance suggested' },
    { value: 'PG-13', label: 'PG-13', description: 'Parents strongly cautioned' },
    { value: 'R', label: 'R', description: 'Restricted, 17+ requires parent' },
    { value: 'NC-17', label: 'NC-17', description: 'Adults only' },
];

export default function ParentalControlsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
    const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/parental-controls');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const res = await api.get<{ data: Array<Omit<Profile, 'maxRating'> & { maxRating: string }> }>('/api/profiles');
                const normalized = (res.data || []).map(profile => ({
                    ...profile,
                    maxRating: normalizeRating(profile.maxRating),
                })) as Profile[];
                setProfiles(normalized);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load profiles');
                setProfiles([]);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchProfiles();
        }
    }, [isAuthenticated]);

    const normalizeRating = (rating: string): MaturityRating => {
        return rating.replace('_', '-') as MaturityRating;
    };

    const handlePinInput = (index: number, value: string, isConfirm = false) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = isConfirm ? [...confirmPin] : [...pin];
        newPin[index] = value.slice(-1);

        if (isConfirm) {
            setConfirmPin(newPin);
        } else {
            setPin(newPin);
        }

        if (value && index < 3) {
            const nextInput = document.getElementById(`pin-${isConfirm ? 'confirm-' : ''}${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleSavePin = async () => {
        const pinValue = pin.join('');
        const confirmValue = confirmPin.join('');

        if (pinStep === 'enter') {
            if (pinValue.length === 4) {
                setPinStep('confirm');
            }
            return;
        }

        if (pinValue !== confirmValue) {
            alert('PINs do not match');
            return;
        }

        if (selectedProfile) {
            try {
                setSaving(true);
                await api.put(`/api/profiles/${selectedProfile.id}`, { pin: pinValue });
                setProfiles(profiles.map(p =>
                    p.id === selectedProfile.id
                        ? { ...p, pinEnabled: true }
                        : p
                ));
                setShowPinModal(false);
                setPin(['', '', '', '']);
                setConfirmPin(['', '', '', '']);
                setPinStep('enter');
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to save PIN');
            } finally {
                setSaving(false);
            }
        }
    };

    const handleRatingChange = async (profileId: string, rating: MaturityRating) => {
        try {
            setSaving(true);
            await api.put(`/api/profiles/${profileId}`, { maxRating: rating });
            setProfiles(profiles.map(p =>
                p.id === profileId ? { ...p, maxRating: rating } : p
            ));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update rating');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleKids = async (profileId: string) => {
        const profile = profiles.find(p => p.id === profileId);
        if (!profile) return;
        const nextIsKids = !profile.isKids;
        const nextRating: MaturityRating = nextIsKids ? 'PG' : profile.maxRating;

        try {
            setSaving(true);
            await api.put(`/api/profiles/${profileId}`, { isKids: nextIsKids, maxRating: nextRating });
            setProfiles(profiles.map(p =>
                p.id === profileId
                    ? { ...p, isKids: nextIsKids, maxRating: nextRating }
                    : p
            ));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleRemovePin = async (profileId: string) => {
        try {
            setSaving(true);
            await api.put(`/api/profiles/${profileId}`, { pinEnabled: false });
            setProfiles(profiles.map(p =>
                p.id === profileId ? { ...p, pinEnabled: false } : p
            ));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to remove PIN');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading || loading) {
        return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <Link href="/account" className={styles.backLink}>&lt;- Back to Account</Link>
                    <h1>Parental Controls</h1>
                    <p>Manage viewing restrictions for each profile</p>
                </div>

                <div className={styles.profilesList}>
                    {error && (
                        <div className={styles.empty}>
                            <span>!</span>
                            <p>{error}</p>
                        </div>
                    )}
                    {!error && profiles.length === 0 && (
                        <div className={styles.empty}>
                            <p>No profiles found.</p>
                        </div>
                    )}
                    {profiles.map(profile => (
                        <div key={profile.id} className={styles.profileCard}>
                            <div className={styles.profileHeader}>
                                <div className={styles.avatar}>
                                    {profile.name.charAt(0)}
                                    {profile.isKids && <span className={styles.kidsBadge}>Kids</span>}
                                </div>
                                <div className={styles.profileInfo}>
                                    <h3>{profile.name}</h3>
                                    <p>{profile.isKids ? 'Kids Profile' : 'Standard Profile'}</p>
                                </div>
                            </div>

                            <div className={styles.settings}>
                                <div className={styles.settingRow}>
                                    <div>
                                        <h4>Kids Mode</h4>
                                        <p>Restrict to kid-friendly content only</p>
                                    </div>
                                    <button
                                        className={`${styles.toggle} ${profile.isKids ? styles.toggleOn : ''}`}
                                        onClick={() => handleToggleKids(profile.id)}
                                        disabled={saving}
                                    >
                                        <span className={styles.toggleKnob} />
                                    </button>
                                </div>

                                <div className={styles.settingRow}>
                                    <div>
                                        <h4>Maximum Maturity Rating</h4>
                                        <p>Content above this rating will be hidden</p>
                                    </div>
                                </div>
                                <div className={styles.ratingOptions}>
                                    {MATURITY_RATINGS.map(rating => (
                                        <button
                                            key={rating.value}
                                            className={`${styles.ratingBtn} ${profile.maxRating === rating.value ? styles.ratingActive : ''}`}
                                            onClick={() => handleRatingChange(profile.id, rating.value)}
                                            disabled={saving || (profile.isKids && ['R', 'NC-17'].includes(rating.value))}
                                        >
                                            <span className={styles.ratingValue}>{rating.label}</span>
                                            <span className={styles.ratingDesc}>{rating.description}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className={styles.settingRow}>
                                    <div>
                                        <h4>Profile Lock</h4>
                                        <p>Require PIN to access this profile</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button
                                            className={styles.pinBtn}
                                            onClick={() => {
                                                setSelectedProfile(profile);
                                                setShowPinModal(true);
                                            }}
                                            disabled={saving}
                                        >
                                            {profile.pinEnabled ? 'Change PIN' : 'Set PIN'}
                                        </button>
                                        {profile.pinEnabled && (
                                            <button
                                                className={styles.pinBtn}
                                                onClick={() => handleRemovePin(profile.id)}
                                                disabled={saving}
                                            >
                                                Remove PIN
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showPinModal && (
                <div className={styles.modalOverlay} onClick={() => setShowPinModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2>{pinStep === 'enter' ? 'Enter PIN' : 'Confirm PIN'}</h2>
                        <p>{pinStep === 'enter' ? 'Create a 4-digit PIN' : 'Enter PIN again to confirm'}</p>

                        <div className={styles.pinInputs}>
                            {(pinStep === 'enter' ? pin : confirmPin).map((digit, i) => (
                                <input
                                    key={i}
                                    id={`pin-${pinStep === 'confirm' ? 'confirm-' : ''}${i}`}
                                    type="password"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handlePinInput(i, e.target.value, pinStep === 'confirm')}
                                    className={styles.pinInput}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowPinModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={handleSavePin}
                                disabled={saving || (pinStep === 'enter' ? pin : confirmPin).some(d => !d)}
                            >
                                {pinStep === 'enter' ? 'Next' : 'Save PIN'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
