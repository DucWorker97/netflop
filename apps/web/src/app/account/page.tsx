'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import styles from './account.module.css';

interface AccountData {
    user: { id: string; email: string; createdAt: string };
    subscription: { plan: string; status: string; startDate: string | null; endDate: string | null };
    paymentMethod: { brand: string; last4: string; expMonth: number; expYear: number } | null;
    billingHistory: Array<{ id: string; amount: number; currency: string; status: string; createdAt: string }>;
    profiles: Array<{ id: string; name: string; avatarUrl: string | null; isKids: boolean; pinEnabled: boolean; maxRating: string }>;
}

type Profile = { id: string; name: string; avatarUrl: string | null; isKids: boolean; pinEnabled: boolean; maxRating: string };

type Tab = 'overview' | 'subscription' | 'billing' | 'security' | 'profiles';

export default function AccountPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [accountData, setAccountData] = useState<AccountData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [profilesLoading, setProfilesLoading] = useState(true);

    // Form states
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [profileForm, setProfileForm] = useState({
        name: '',
        avatarUrl: '',
        isKids: false,
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/account');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchAccountData = async () => {
            try {
                const data = await api.get<AccountData>('/api/account/settings');
                setAccountData(data);
                setEmail(data.user.email);
                setProfiles(data.profiles || []);
            } catch (error) {
                console.error('Failed to fetch account data:', error);
            } finally {
                setLoading(false);
                setProfilesLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchAccountData();
        }
    }, [isAuthenticated]);

    const handleUpdateEmail = async () => {
        try {
            setSaving(true);
            const data = await api.put<{ id: string; email: string }>('/api/account/profile', { email });
            setAccountData(prev => prev ? { ...prev, user: { ...prev.user, email: data.email } } : prev);
            alert('Email updated successfully');
        } catch (error: any) {
            alert(error.message || 'Failed to update email');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        try {
            setSaving(true);
            await api.post('/api/account/change-password', { currentPassword, newPassword });
            alert('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            alert(error.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setSaving(true);
            await api.delete('/api/account/delete', { password: deletePassword });
            logout();
            router.push('/');
        } catch (error: any) {
            alert(error.message || 'Failed to delete account');
        } finally {
            setSaving(false);
        }
    };

    const openCreateProfile = () => {
        setEditingProfile(null);
        setProfileForm({ name: '', avatarUrl: '', isKids: false });
        setProfileError(null);
        setShowProfileModal(true);
    };

    const openEditProfile = (profile: Profile) => {
        setEditingProfile(profile);
        setProfileForm({
            name: profile.name,
            avatarUrl: profile.avatarUrl || '',
            isKids: profile.isKids,
        });
        setProfileError(null);
        setShowProfileModal(true);
    };

    const closeProfileModal = () => {
        setShowProfileModal(false);
        setEditingProfile(null);
        setProfileError(null);
        setProfileSaving(false);
    };

    const handleSaveProfile = async () => {
        if (!profileForm.name.trim()) {
            setProfileError('Profile name is required');
            return;
        }

        setProfileSaving(true);
        setProfileError(null);

        try {
            if (editingProfile) {
                const data = await api.put<{ data: Profile }>(`/api/profiles/${editingProfile.id}`, {
                    name: profileForm.name.trim(),
                    avatarUrl: profileForm.avatarUrl.trim() || undefined,
                    isKids: profileForm.isKids,
                });
                const updated = data.data;
                setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            } else {
                const data = await api.post<{ data: Profile }>('/api/profiles', {
                    name: profileForm.name.trim(),
                    avatarUrl: profileForm.avatarUrl.trim() || undefined,
                    isKids: profileForm.isKids,
                });
                setProfiles((prev) => [...prev, data.data]);
            }

            closeProfileModal();
        } catch (error) {
            setProfileError(error instanceof Error ? error.message : 'Failed to save profile');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleDeleteProfile = async (profileId: string) => {
        if (!confirm('Delete this profile?')) return;
        try {
            await api.delete(`/api/profiles/${profileId}`);
            setProfiles((prev) => prev.filter((p) => p.id !== profileId));
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to delete profile');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const planPrices: Record<string, number> = { FREE: 0, BASIC: 9.99, PREMIUM: 15.99 };

    if (authLoading || loading) {
        return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1>Account Settings</h1>

                {/* Tabs */}
                <div className={styles.tabs}>
                    {(['overview', 'subscription', 'billing', 'profiles', 'security'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && accountData && (
                    <div className={styles.section}>
                        <div className={styles.overviewGrid}>
                            {/* Profile Card */}
                            <div className={styles.card}>
                                <h3>👤 Profile</h3>
                                <div className={styles.cardContent}>
                                    <p><strong>Email:</strong> {accountData.user.email}</p>
                                    <p><strong>Member since:</strong> {formatDate(accountData.user.createdAt)}</p>
                                    <p><strong>Profiles:</strong> {profiles.length}</p>
                                </div>
                            </div>

                            {/* Subscription Card */}
                            <div className={styles.card}>
                                <h3>📺 Subscription</h3>
                                <div className={styles.cardContent}>
                                    <div className={styles.planBadge} data-plan={accountData.subscription.plan.toLowerCase()}>
                                        {accountData.subscription.plan}
                                    </div>
                                    <p><strong>Status:</strong> {accountData.subscription.status}</p>
                                    {accountData.subscription.endDate && (
                                        <p><strong>Next billing:</strong> {formatDate(accountData.subscription.endDate)}</p>
                                    )}
                                    <Link href="/pricing" className={styles.link}>Change Plan →</Link>
                                </div>
                            </div>

                            {/* Billing Card */}
                            <div className={styles.card}>
                                <h3>💳 Billing</h3>
                                <div className={styles.cardContent}>
                                    <p><strong>Monthly:</strong> ${planPrices[accountData.subscription.plan] || 0}/mo</p>
                                    {accountData.paymentMethod ? (
                                        <p><strong>Card:</strong> •••• {accountData.paymentMethod.last4}</p>
                                    ) : (
                                        <p className={styles.muted}>No payment method</p>
                                    )}
                                    <Link href="/payment-methods" className={styles.link}>Manage →</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Subscription Tab */}
                {activeTab === 'subscription' && accountData && (
                    <div className={styles.section}>
                        <div className={styles.subscriptionDetails}>
                            <div className={styles.currentPlan}>
                                <span className={styles.planLabel}>Current Plan</span>
                                <span className={`${styles.planName} ${styles[accountData.subscription.plan.toLowerCase()]}`}>
                                    {accountData.subscription.plan}
                                </span>
                                <span className={styles.planPrice}>
                                    ${planPrices[accountData.subscription.plan]}/month
                                </span>
                            </div>

                            <div className={styles.planStatus}>
                                <div className={styles.statusItem}>
                                    <span>Status</span>
                                    <span className={`${styles.badge} ${styles[accountData.subscription.status.toLowerCase()]}`}>
                                        {accountData.subscription.status}
                                    </span>
                                </div>
                                {accountData.subscription.endDate && (
                                    <div className={styles.statusItem}>
                                        <span>Next billing date</span>
                                        <span>{formatDate(accountData.subscription.endDate)}</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.actions}>
                                <Link href="/pricing" className={styles.primaryBtn}>
                                    {accountData.subscription.plan === 'FREE' ? 'Upgrade Plan' : 'Change Plan'}
                                </Link>
                                {accountData.subscription.plan !== 'FREE' && (
                                    <Link href="/subscription" className={styles.secondaryBtn}>
                                        Cancel Subscription
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Billing Tab - Enhanced */}
                {activeTab === 'billing' && accountData && (
                    <div className={styles.section}>
                        {/* Billing Summary Card */}
                        <div className={styles.billingSummary}>
                            <div className={styles.billingSummaryHeader}>
                                <h2 className={styles.sectionTitle}>💰 Billing Summary</h2>
                                <span className={styles.currentPeriod}>Current billing period</span>
                            </div>
                            <div className={styles.billingSummaryContent}>
                                <div className={styles.billingAmount}>
                                    <span className={styles.currency}>$</span>
                                    <span className={styles.amount}>{planPrices[accountData.subscription.plan] || 0}</span>
                                    <span className={styles.period}>/month</span>
                                </div>
                                <div className={styles.billingPlan}>
                                    <span className={styles.planBadge} data-plan={accountData.subscription.plan.toLowerCase()}>
                                        {accountData.subscription.plan}
                                    </span>
                                    <Link href="/pricing" className={styles.link}>Change plan →</Link>
                                </div>
                                {accountData.subscription.endDate && (
                                    <p className={styles.nextBilling}>
                                        📅 Next billing date: <strong>{formatDate(accountData.subscription.endDate)}</strong>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Payment Method Section */}
                        <div className={styles.billingSection}>
                            <div className={styles.billingSectionHeader}>
                                <h3>💳 Payment Method</h3>
                                <Link href="/payment-methods" className={styles.link}>Manage</Link>
                            </div>
                            {accountData.paymentMethod ? (
                                <div className={styles.paymentCardEnhanced}>
                                    <div className={styles.cardBrand}>
                                        <span className={styles.genericCardIcon}>💳</span>
                                    </div>
                                    <div className={styles.cardDetails}>
                                        <div className={styles.cardNumber}>
                                            <span className={styles.cardDots}>•••• •••• ••••</span>
                                            <span className={styles.cardLast4}>{accountData.paymentMethod.last4}</span>
                                        </div>
                                        <div className={styles.cardMeta}>
                                            <span>{accountData.paymentMethod.brand}</span>
                                            <span className={styles.cardExpiry}>
                                                Expires {String(accountData.paymentMethod.expMonth).padStart(2, '0')}/{accountData.paymentMethod.expYear}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.cardStatus}>
                                        <span className={`${styles.badge} ${styles.active}`}>Active</span>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.noPaymentMethod}>
                                    <div className={styles.noPaymentIcon}>💳</div>
                                    <div className={styles.noPaymentText}>
                                        <p>No payment method on file</p>
                                        <span>Add a payment method to subscribe to premium features</span>
                                    </div>
                                    <Link href="/payment-methods" className={styles.primaryBtn}>
                                        Add Payment Method
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Billing History Section */}
                        <div className={styles.billingSection}>
                            <div className={styles.billingSectionHeader}>
                                <h3>📋 Billing History</h3>
                            </div>
                            {accountData.billingHistory.length > 0 ? (
                                <div className={styles.historyTableEnhanced}>
                                    <div className={styles.historyHeader}>
                                        <span>Date</span>
                                        <span>Description</span>
                                        <span>Amount</span>
                                        <span>Status</span>
                                    </div>
                                    {accountData.billingHistory.map(payment => (
                                        <div key={payment.id} className={styles.historyRowEnhanced}>
                                            <span className={styles.historyDate}>{formatDate(payment.createdAt)}</span>
                                            <span className={styles.historyDesc}>Monthly subscription</span>
                                            <span className={styles.historyAmount}>${payment.amount.toFixed(2)}</span>
                                            <span className={`${styles.badge} ${styles[payment.status.toLowerCase()]}`}>
                                                {payment.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.noHistory}>
                                    <div className={styles.noHistoryIcon}>📋</div>
                                    <p>No billing history yet</p>
                                    <span className={styles.muted}>Your payment history will appear here once you make a purchase</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Profiles Tab */}
                {activeTab === 'profiles' && (
                    <div className={styles.section}>
                        <div className={styles.profilesHeader}>
                            <div>
                                <h2>Profiles</h2>
                                <p className={styles.muted}>Manage who watches on your account.</p>
                            </div>
                            <button className={styles.primaryBtn} onClick={openCreateProfile}>
                                Add Profile
                            </button>
                        </div>

                        {profilesLoading ? (
                            <div className={styles.loading}>Loading profiles...</div>
                        ) : profiles.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No profiles yet.</p>
                                <button className={styles.primaryBtn} onClick={openCreateProfile}>
                                    Create your first profile
                                </button>
                            </div>
                        ) : (
                            <div className={styles.profilesGrid}>
                                {profiles.map((profile) => (
                                    <div key={profile.id} className={styles.profileCard}>
                                        <div className={styles.profileAvatar}>
                                            {profile.avatarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={profile.avatarUrl} alt={profile.name} />
                                            ) : (
                                                <span>{profile.name.charAt(0).toUpperCase()}</span>
                                            )}
                                            {profile.isKids && <span className={styles.kidsBadge}>Kids</span>}
                                        </div>
                                        <div className={styles.profileInfo}>
                                            <h3>{profile.name}</h3>
                                            <p>{profile.isKids ? 'Kids profile' : 'Standard profile'}</p>
                                        </div>
                                        <div className={styles.profileActions}>
                                            <button className={styles.secondaryBtn} onClick={() => openEditProfile(profile)}>
                                                Edit
                                            </button>
                                            <button className={styles.dangerBtn} onClick={() => handleDeleteProfile(profile.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className={styles.section}>
                        <h2>Email</h2>
                        <div className={styles.formGroup}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                            />
                            <button onClick={handleUpdateEmail} disabled={saving} className={styles.saveBtn}>
                                {saving ? 'Saving...' : 'Update Email'}
                            </button>
                        </div>

                        <h2>Change Password</h2>
                        <div className={styles.formGroup}>
                            <input
                                type="password"
                                placeholder="Current password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className={styles.input}
                            />
                            <input
                                type="password"
                                placeholder="New password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={styles.input}
                            />
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={styles.input}
                            />
                            <button onClick={handleChangePassword} disabled={saving} className={styles.saveBtn}>
                                {saving ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>

                        <h2>Danger Zone</h2>
                        <div className={styles.dangerZone}>
                            <p>Once you delete your account, there is no going back. Please be certain.</p>
                            <button onClick={() => setShowDeleteModal(true)} className={styles.deleteBtn}>
                                Delete Account
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2>Delete Account?</h2>
                        <p>This action cannot be undone. All your data will be permanently deleted.</p>
                        <input
                            type="password"
                            placeholder="Enter your password to confirm"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className={styles.input}
                        />
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowDeleteModal(false)} className={styles.cancelBtn}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteAccount} disabled={saving || !deletePassword} className={styles.confirmDeleteBtn}>
                                {saving ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showProfileModal && (
                <div className={styles.modalOverlay} onClick={closeProfileModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>{editingProfile ? 'Edit Profile' : 'Add Profile'}</h2>
                        <p>Profiles help personalize recommendations and parental controls.</p>

                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                placeholder="Profile name"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                                className={styles.input}
                            />
                            <input
                                type="text"
                                placeholder="Avatar image URL (optional)"
                                value={profileForm.avatarUrl}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                                className={styles.input}
                            />
                            <label className={styles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={profileForm.isKids}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, isKids: e.target.checked }))}
                                />
                                <span>Kids profile</span>
                            </label>
                        </div>

                        {profileError && <p className={styles.formError}>{profileError}</p>}

                        <div className={styles.modalActions}>
                            <button onClick={closeProfileModal} className={styles.cancelBtn}>
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={profileSaving}
                                className={styles.primaryBtn}
                            >
                                {profileSaving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
