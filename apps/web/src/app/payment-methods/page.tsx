'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import styles from './payment-methods.module.css';

interface PaymentMethod {
    id: string;
    brand: 'visa' | 'mastercard' | 'amex' | 'card';
    last4: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
}

const CARD_ICONS: Record<PaymentMethod['brand'], string> = {
    visa: '\u{1F4B3}',
    mastercard: '\u{1F4B3}',
    amex: '\u{1F4B3}',
    card: '\u{1F4B3}',
};

export default function PaymentMethodsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newCard, setNewCard] = useState({ number: '', expiry: '', cvv: '', name: '' });

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/payment-methods');
        }
    }, [isLoading, isAuthenticated, router]);

    const fetchMethods = useCallback(async () => {
        try {
            const res = await api.get<{ data: PaymentMethod[] }>('/api/payment-methods');
            setMethods(res.data || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load payment methods');
            setMethods([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchMethods();
        }
    }, [isAuthenticated, fetchMethods]);

    const handleSetDefault = async (id: string) => {
        try {
            await api.patch(`/api/payment-methods/${id}/default`);
            setMethods(methods.map(m => ({ ...m, isDefault: m.id === id })));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to set default');
        }
    };

    const handleRemove = async (id: string) => {
        if (!confirm('Are you sure you want to remove this payment method?')) return;
        try {
            await api.delete(`/api/payment-methods/${id}`);
            await fetchMethods();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to remove payment method');
        }
    };

    const handleAddCard = async () => {
        const [month, year] = newCard.expiry.split('/');
        const expMonth = parseInt(month, 10);
        const expYear = 2000 + parseInt(year || '0', 10);

        if (!expMonth || !expYear || expMonth < 1 || expMonth > 12) {
            alert('Please enter a valid expiry date');
            return;
        }

        try {
            setSaving(true);
            const res = await api.post<{ data: PaymentMethod }>('/api/payment-methods', {
                cardNumber: newCard.number.replace(/\s/g, ''),
                expMonth,
                expYear,
            });
            setMethods(prev => [...prev, res.data]);
            setNewCard({ number: '', expiry: '', cvv: '', name: '' });
            setShowAddModal(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to add payment method');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        let formattedValue = value;

        if (field === 'number') {
            formattedValue = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
        } else if (field === 'expiry') {
            formattedValue = value.replace(/\D/g, '').replace(/^(.{2})/, '$1/').slice(0, 5);
        } else if (field === 'cvv') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
        }

        setNewCard(prev => ({ ...prev, [field]: formattedValue }));
    };

    if (isLoading || loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <Link href="/subscription" className={styles.backLink}>&lt;- Back to Subscription</Link>
                    <h1>Payment Methods</h1>
                </div>

                {/* Cards List */}
                <div className={styles.cardsList}>
                    {error && (
                        <div className={styles.empty}>
                            <span>!</span>
                            <h3>Unable to load payment methods</h3>
                            <p>{error}</p>
                        </div>
                    )}
                    {!error && methods.length === 0 ? (
                        <div className={styles.empty}>
                            <span>{CARD_ICONS.card}</span>
                            <h3>No payment methods</h3>
                            <p>Add a card to manage your subscription</p>
                        </div>
                    ) : (
                        methods.map(method => (
                            <div key={method.id} className={styles.cardItem}>
                                <div className={styles.cardIcon}>
                                    {CARD_ICONS[method.brand]}
                                </div>
                                <div className={styles.cardInfo}>
                                    <div className={styles.cardType}>
                                        {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)}
                                        {method.isDefault && (
                                            <span className={styles.defaultBadge}>Default</span>
                                        )}
                                    </div>
                                    <div className={styles.cardNumber}>
                                        **** **** **** {method.last4}
                                    </div>
                                    <div className={styles.cardExpiry}>
                                        Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                                    </div>
                                </div>
                                <div className={styles.cardActions}>
                                    {!method.isDefault && (
                                        <button
                                            className={styles.setDefaultBtn}
                                            onClick={() => handleSetDefault(method.id)}
                                        >
                                            Set Default
                                        </button>
                                    )}
                                    <button
                                        className={styles.removeBtn}
                                        onClick={() => handleRemove(method.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Button */}
                <button
                    className={styles.addBtn}
                    onClick={() => setShowAddModal(true)}
                >
                    + Add Payment Method
                </button>

                {/* Security Note */}
                <div className={styles.securityNote}>
                    <span>{'\u{1F512}'}</span>
                    <div>
                        <h4>Your payment info is secure</h4>
                        <p>We use industry-standard encryption to protect your data</p>
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Add Payment Method</h2>
                            <button onClick={() => setShowAddModal(false)}>X</button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.field}>
                                <label>Card Number</label>
                                <input
                                    type="text"
                                    placeholder="1234 5678 9012 3456"
                                    value={newCard.number}
                                    onChange={(e) => handleInputChange('number', e.target.value)}
                                />
                            </div>

                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Expiry Date</label>
                                    <input
                                        type="text"
                                        placeholder="MM/YY"
                                        value={newCard.expiry}
                                        onChange={(e) => handleInputChange('expiry', e.target.value)}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>CVV</label>
                                    <input
                                        type="text"
                                        placeholder="123"
                                        value={newCard.cvv}
                                        onChange={(e) => handleInputChange('cvv', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label>Cardholder Name</label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={newCard.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowAddModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={handleAddCard}
                                disabled={saving || !newCard.number || !newCard.expiry || !newCard.name}
                            >
                                {saving ? 'Saving...' : 'Add Card'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
