'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface UserProfile {
    id: string;
    email: string;
    role: string;
    createdAt: string;
    stats: {
        favorites: number;
        watchHistory: number;
        ratings: number;
    };
}

export default function ProfilePage() {
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Password change form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (isAuthenticated) {
            fetchProfile();
        }
    }, [authLoading, isAuthenticated, router]);

    const fetchProfile = async () => {
        try {
            const res = await api.get<{ data: UserProfile }>('/api/users/profile');
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        setChangingPassword(true);
        try {
            await api.post('/api/users/change-password', {
                currentPassword,
                newPassword,
            });
            setPasswordSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div style={{ padding: '6rem 2rem 2rem' }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                    <div className="skeleton" style={{ height: 40, width: 200, marginBottom: '2rem' }} />
                    <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div style={{ padding: '6rem 2rem 2rem' }}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>
                    Profile Settings
                </h1>

                {/* Profile Info Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Account Info
                    </h2>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                            <span>{profile?.email}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Role</span>
                            <span style={{
                                background: profile?.role === 'admin' ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: 4,
                                fontSize: '0.875rem'
                            }}>
                                {profile?.role}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Member since</span>
                            <span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Your Activity
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>
                                {profile?.stats.favorites || 0}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Favorites</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>
                                {profile?.stats.watchHistory || 0}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Watched</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>
                                {profile?.stats.ratings || 0}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Ratings</div>
                        </div>
                    </div>
                </div>

                {/* Change Password Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Change Password
                    </h2>

                    <form onSubmit={handleChangePassword}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 6,
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 6,
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 6,
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        {passwordError && (
                            <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                {passwordError}
                            </div>
                        )}

                        {passwordSuccess && (
                            <div style={{ color: '#22c55e', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                {passwordSuccess}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={changingPassword}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            {changingPassword ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>

                {/* Logout Button */}
                <button
                    onClick={logout}
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
