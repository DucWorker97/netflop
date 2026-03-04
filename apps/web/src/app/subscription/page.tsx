'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import styles from './subscription.module.css';

interface Subscription {
    id?: string;
    plan: 'FREE' | 'BASIC' | 'PREMIUM';
    status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
    startDate?: string;
    endDate?: string | null;
    payments?: Payment[];
}

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    provider: string;
    createdAt: string;
}

const PLAN_DETAILS = {
    FREE: { name: 'Free', price: 0, color: '#6b7280' },
    BASIC: { name: 'Basic', price: 9.99, color: '#3b82f6' },
    PREMIUM: { name: 'Premium', price: 15.99, color: '#8b5cf6' },
};

export default function SubscriptionPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [invoices, setInvoices] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/subscription');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const [subscriptionData, invoicesData] = await Promise.all([
                    api.get<Subscription>('/api/billing/my-subscription'),
                    api.get<Payment[]>('/api/billing/invoices'),
                ]);
                setSubscription(subscriptionData);
                setInvoices(invoicesData);
            } catch (error) {
                console.error('Failed to fetch subscription:', error);
                setInvoices([]);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchSubscription();
        }
    }, [isAuthenticated]);

    const handleCancel = async () => {
        try {
            setCancelLoading(true);
            await api.post('/api/billing/cancel');
            setSubscription(prev => prev ? { ...prev, status: 'CANCELED' } : null);
            setShowCancelModal(false);
        } catch (error) {
            console.error('Failed to cancel:', error);
            alert('Failed to cancel subscription. Please try again.');
        } finally {
            setCancelLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (isLoading || loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    const plan = subscription?.plan || 'FREE';
    const planInfo = PLAN_DETAILS[plan];
    const isActive = subscription?.status === 'ACTIVE';

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <Link href="/account" className={styles.backLink}>← Back to Account</Link>
                    <h1>Subscription</h1>
                </div>

                {/* Current Plan Card */}
                <div className={styles.planCard} style={{ borderColor: planInfo.color }}>
                    <div className={styles.planBadge} style={{ background: planInfo.color }}>
                        {planInfo.name}
                    </div>
                    <div className={styles.planInfo}>
                        <div className={styles.planPrice}>
                            <span className={styles.amount}>${planInfo.price}</span>
                            <span className={styles.period}>/month</span>
                        </div>
                        <div className={styles.planStatus}>
                            <span className={`${styles.statusBadge} ${styles[subscription?.status?.toLowerCase() || 'active']}`}>
                                {subscription?.status || 'ACTIVE'}
                            </span>
                        </div>
                    </div>

                    {subscription?.endDate && (
                        <div className={styles.billingInfo}>
                            <div className={styles.billingRow}>
                                <span>Next billing date</span>
                                <span>{formatDate(subscription.endDate)}</span>
                            </div>
                            {subscription.startDate && (
                                <div className={styles.billingRow}>
                                    <span>Member since</span>
                                    <span>{formatDate(subscription.startDate)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.planActions}>
                        <Link href="/pricing" className={styles.changePlanBtn}>
                            {plan === 'FREE' ? 'Upgrade Plan' : 'Change Plan'}
                        </Link>
                        {plan !== 'FREE' && isActive && (
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowCancelModal(true)}
                            >
                                Cancel Subscription
                            </button>
                        )}
                    </div>
                </div>

                {/* Payment History */}
                <div className={styles.historySection}>
                    <h2>Payment History</h2>
                    {invoices.length > 0 ? (
                        <div className={styles.historyTable}>
                            <div className={styles.tableHeader}>
                                <span>Date</span>
                                <span>Amount</span>
                                <span>Status</span>
                            </div>
                            {invoices.map((payment) => (
                                <div key={payment.id} className={styles.tableRow}>
                                    <span>{formatDate(payment.createdAt)}</span>
                                    <span>${payment.amount.toFixed(2)} {payment.currency}</span>
                                    <span className={`${styles.paymentStatus} ${styles[payment.status.toLowerCase()]}`}>
                                        {payment.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyHistory}>
                            <span>💳</span>
                            <p>No payment history</p>
                        </div>
                    )}
                </div>

                {/* Quick Links */}
                <div className={styles.quickLinks}>
                    <Link href="/payment-methods" className={styles.quickLink}>
                        <span>💳</span>
                        <div>
                            <h3>Payment Methods</h3>
                            <p>Manage your payment cards</p>
                        </div>
                        <span>→</span>
                    </Link>
                    <Link href="/account" className={styles.quickLink}>
                        <span>👤</span>
                        <div>
                            <h3>Account Settings</h3>
                            <p>Update profile and preferences</p>
                        </div>
                        <span>→</span>
                    </Link>
                </div>
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2>Cancel Subscription?</h2>
                        <p>
                            Your subscription will remain active until the end of the current billing
                            period on <strong>{subscription?.endDate ? formatDate(subscription.endDate) : 'N/A'}</strong>.
                        </p>
                        <p className={styles.warning}>
                            After cancellation, you'll lose access to:
                        </p>
                        <ul className={styles.lossList}>
                            <li>HD/4K streaming quality</li>
                            <li>Ad-free viewing</li>
                            <li>Downloads for offline viewing</li>
                        </ul>
                        <div className={styles.modalActions}>
                            <button
                                className={styles.keepBtn}
                                onClick={() => setShowCancelModal(false)}
                            >
                                Keep Subscription
                            </button>
                            <button
                                className={styles.confirmCancelBtn}
                                onClick={handleCancel}
                                disabled={cancelLoading}
                            >
                                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
