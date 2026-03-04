'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import styles from './checkout.module.css';

type PlanId = 'FREE' | 'BASIC' | 'PREMIUM';

interface PlanPricing {
    id: PlanId;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
}

const FALLBACK_PLANS: PlanPricing[] = [
    { id: 'BASIC', name: 'Basic', monthlyPrice: 9.99, yearlyPrice: 95.88 },
    { id: 'PREMIUM', name: 'Premium', monthlyPrice: 15.99, yearlyPrice: 153.5 },
];

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const planId = (searchParams.get('plan') as PlanId) || 'BASIC';
    const billing = searchParams.get('billing') || 'monthly';
    const [plans, setPlans] = useState<PlanPricing[]>(FALLBACK_PLANS);
    const [plansLoading, setPlansLoading] = useState(true);
    const [plansError, setPlansError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            const planParam = planId || 'BASIC';
            const billingParam = billing || 'monthly';
            router.push(`/login?redirect=/checkout?plan=${planParam}&billing=${billingParam}`);
            return;
        }

        if (planId === 'FREE') {
            router.replace('/pricing');
        }
    }, [authLoading, isAuthenticated, planId, billing, router]);

    useEffect(() => {
        let isMounted = true;
        const fetchPlans = async () => {
            try {
                const data = await api.get<PlanPricing[]>('/api/billing/plans');
                if (!isMounted) return;
                const safePlans = Array.isArray(data) && data.length > 0 ? data : FALLBACK_PLANS;
                setPlans(safePlans.filter(p => p.id !== 'FREE'));
                setPlansError(null);
            } catch (error) {
                if (!isMounted) return;
                setPlans(FALLBACK_PLANS);
                setPlansError(error instanceof Error ? error.message : 'Failed to load plans');
            } finally {
                if (isMounted) setPlansLoading(false);
            }
        };

        fetchPlans();
        return () => { isMounted = false; };
    }, []);

    const plan = useMemo(() => {
        const match = plans.find(p => p.id === planId);
        return match || plans[0] || FALLBACK_PLANS[0];
    }, [plans, planId]);

    const price = billing === 'annual' ? plan.yearlyPrice : plan.monthlyPrice;
    const period = billing === 'annual' ? 'year' : 'month';

    const [formData, setFormData] = useState({
        cardNumber: '',
        expiry: '',
        cvv: '',
        name: '',
        promoCode: '',
    });
    const [promoApplied, setPromoApplied] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (field: string, value: string) => {
        let formattedValue = value;

        if (field === 'cardNumber') {
            formattedValue = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
        } else if (field === 'expiry') {
            formattedValue = value.replace(/\D/g, '').replace(/^(.{2})/, '$1/').slice(0, 5);
        } else if (field === 'cvv') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
        }

        setFormData(prev => ({ ...prev, [field]: formattedValue }));
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const applyPromoCode = () => {
        if (formData.promoCode.toUpperCase() === 'SAVE10') {
            setPromoApplied(true);
            setDiscount(price * 0.1);
        } else if (formData.promoCode.toUpperCase() === 'FIRST50') {
            setPromoApplied(true);
            setDiscount(price * 0.5);
        } else {
            setErrors(prev => ({ ...prev, promoCode: 'Invalid promo code' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
            newErrors.cardNumber = 'Valid card number required';
        }
        if (!formData.expiry || formData.expiry.length < 5) {
            newErrors.expiry = 'Valid expiry required';
        }
        if (!formData.cvv || formData.cvv.length < 3) {
            newErrors.cvv = 'Valid CVV required';
        }
        if (!formData.name.trim()) {
            newErrors.name = 'Cardholder name required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            setLoading(true);
            await api.post('/api/billing/subscribe', { plan: planId, billingCycle: billing });
            router.push('/subscription?success=true');
        } catch (error) {
            console.error('Payment failed:', error);
            setErrors({ submit: 'Payment failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const finalPrice = price - discount;

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <Link href="/pricing" className={styles.backLink}>← Back to Plans</Link>
                    <h1>Complete Your Order</h1>
                </div>

                <div className={styles.grid}>
                    {/* Payment Form */}
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <h2>Payment Details</h2>

                        {/* Card Number */}
                        <div className={styles.field}>
                            <label>Card Number</label>
                            <input
                                type="text"
                                placeholder="1234 5678 9012 3456"
                                value={formData.cardNumber}
                                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                                className={errors.cardNumber ? styles.error : ''}
                            />
                            {errors.cardNumber && <span className={styles.errorText}>{errors.cardNumber}</span>}
                        </div>

                        {/* Expiry & CVV */}
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Expiry Date</label>
                                <input
                                    type="text"
                                    placeholder="MM/YY"
                                    value={formData.expiry}
                                    onChange={(e) => handleInputChange('expiry', e.target.value)}
                                    className={errors.expiry ? styles.error : ''}
                                />
                                {errors.expiry && <span className={styles.errorText}>{errors.expiry}</span>}
                            </div>
                            <div className={styles.field}>
                                <label>CVV</label>
                                <input
                                    type="text"
                                    placeholder="123"
                                    value={formData.cvv}
                                    onChange={(e) => handleInputChange('cvv', e.target.value)}
                                    className={errors.cvv ? styles.error : ''}
                                />
                                {errors.cvv && <span className={styles.errorText}>{errors.cvv}</span>}
                            </div>
                        </div>

                        {/* Name */}
                        <div className={styles.field}>
                            <label>Cardholder Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={errors.name ? styles.error : ''}
                            />
                            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                        </div>

                        {/* Promo Code */}
                        <div className={styles.promoField}>
                            <label>Promo Code (Optional)</label>
                            <div className={styles.promoInput}>
                                <input
                                    type="text"
                                    placeholder="Enter code"
                                    value={formData.promoCode}
                                    onChange={(e) => handleInputChange('promoCode', e.target.value.toUpperCase())}
                                    disabled={promoApplied}
                                />
                                <button
                                    type="button"
                                    onClick={applyPromoCode}
                                    disabled={promoApplied || !formData.promoCode}
                                >
                                    {promoApplied ? '✓ Applied' : 'Apply'}
                                </button>
                            </div>
                            {errors.promoCode && <span className={styles.errorText}>{errors.promoCode}</span>}
                            {promoApplied && <span className={styles.successText}>Promo code applied!</span>}
                        </div>

                        {errors.submit && (
                            <div className={styles.submitError}>{errors.submit}</div>
                        )}

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : `Pay $${finalPrice.toFixed(2)}`}
                        </button>

                        <p className={styles.terms}>
                            By confirming, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </form>

                    {/* Order Summary */}
                    <div className={styles.summary}>
                        <h2>Order Summary</h2>
                        {plansLoading && (
                            <p className={styles.muted}>Loading latest pricing...</p>
                        )}
                        {plansError && !plansLoading && (
                            <p className={styles.muted}>{plansError}</p>
                        )}

                        <div className={styles.planSummary}>
                            <div className={styles.planName}>
                                <span className={styles.planIcon}>🎬</span>
                                <div>
                                    <h3>{plan.name} Plan</h3>
                                    <p>Billed {billing === 'annual' ? 'annually' : 'monthly'}</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.priceBreakdown}>
                            <div className={styles.priceRow}>
                                <span>{plan.name} ({billing})</span>
                                <span>${price.toFixed(2)}</span>
                            </div>
                            {discount > 0 && (
                                <div className={`${styles.priceRow} ${styles.discountRow}`}>
                                    <span>Promo Discount</span>
                                    <span>-${discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className={`${styles.priceRow} ${styles.totalRow}`}>
                                <span>Total</span>
                                <span>${finalPrice.toFixed(2)}/{period}</span>
                            </div>
                        </div>

                        <div className={styles.features}>
                            <h4>Included Features:</h4>
                            <ul>
                                {planId === 'PREMIUM' ? (
                                    <>
                                        <li>✓ Ultra HD (4K) + HDR</li>
                                        <li>✓ 4 simultaneous streams</li>
                                        <li>✓ Spatial Audio</li>
                                        <li>✓ Downloads on 6 devices</li>
                                    </>
                                ) : (
                                    <>
                                        <li>✓ HD (720p)</li>
                                        <li>✓ 2 simultaneous streams</li>
                                        <li>✓ Downloads on 2 devices</li>
                                    </>
                                )}
                                <li>✓ Ad-free streaming</li>
                                <li>✓ Cancel anytime</li>
                            </ul>
                        </div>

                        <div className={styles.secure}>
                            🔒 Secure payment powered by Stripe
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0d0d0d' }} />}>
            <CheckoutContent />
        </Suspense>
    );
}
