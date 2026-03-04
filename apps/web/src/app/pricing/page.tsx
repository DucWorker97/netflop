'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import styles from './pricing.module.css';

type PlanId = 'FREE' | 'BASIC' | 'PREMIUM';

interface PlanPricing {
    id: PlanId;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
}

const PLAN_FEATURES: Record<PlanId, { features: Array<{ text: string; included: boolean }>; popular: boolean }> = {
    FREE: {
        features: [
            { text: 'Standard Definition (480p)', included: true },
            { text: 'With Ads', included: true },
            { text: '1 Device', included: true },
            { text: 'Download Content', included: false },
            { text: '4K + HDR', included: false },
            { text: 'Spatial Audio', included: false },
        ],
        popular: false,
    },
    BASIC: {
        features: [
            { text: 'High Definition (720p)', included: true },
            { text: 'No Ads', included: true },
            { text: '2 Devices', included: true },
            { text: 'Download Content', included: true },
            { text: '4K + HDR', included: false },
            { text: 'Spatial Audio', included: false },
        ],
        popular: true,
    },
    PREMIUM: {
        features: [
            { text: 'Ultra HD (4K) + HDR', included: true },
            { text: 'No Ads', included: true },
            { text: '4 Devices', included: true },
            { text: 'Download Content', included: true },
            { text: '4K + HDR', included: true },
            { text: 'Spatial Audio', included: true },
        ],
        popular: false,
    },
};

const PLAN_ORDER: PlanId[] = ['FREE', 'BASIC', 'PREMIUM'];

const FALLBACK_PLANS: PlanPricing[] = [
    { id: 'FREE', name: 'Free', monthlyPrice: 0, yearlyPrice: 0 },
    { id: 'BASIC', name: 'Basic', monthlyPrice: 9.99, yearlyPrice: 95.88 },
    { id: 'PREMIUM', name: 'Premium', monthlyPrice: 15.99, yearlyPrice: 153.5 },
];

const FAQ = [
    {
        question: 'Can I change my plan anytime?',
        answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and you\'ll be charged the prorated difference.',
    },
    {
        question: 'How do I cancel my subscription?',
        answer: 'You can cancel anytime from your account settings. You\'ll continue to have access until the end of your billing period.',
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and various local payment methods.',
    },
    {
        question: 'Is there a free trial?',
        answer: 'New users get a 7-day free trial on Basic and Premium plans. Cancel before the trial ends to avoid charges.',
    },
    {
        question: 'Can I share my account?',
        answer: 'Account sharing is based on your plan. Basic allows 2 simultaneous streams, Premium allows 4. Extra member add-ons are available.',
    },
];

export default function PricingPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [isAnnual, setIsAnnual] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [plans, setPlans] = useState<PlanPricing[]>(FALLBACK_PLANS);
    const [plansLoading, setPlansLoading] = useState(true);
    const [plansError, setPlansError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchPlans = async () => {
            try {
                const data = await api.get<PlanPricing[]>('/api/billing/plans');
                if (!isMounted) return;
                setPlans(Array.isArray(data) && data.length > 0 ? data : FALLBACK_PLANS);
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

    const displayPlans = useMemo(() => {
        const byId = new Map(plans.map(plan => [plan.id, plan]));
        return PLAN_ORDER
            .map(id => byId.get(id))
            .filter((plan): plan is PlanPricing => Boolean(plan))
            .map(plan => ({
                ...plan,
                features: PLAN_FEATURES[plan.id].features,
                popular: PLAN_FEATURES[plan.id].popular,
            }));
    }, [plans]);

    const handleSubscribe = async (planId: string) => {
        if (!isAuthenticated) {
            router.push('/login?redirect=/pricing');
            return;
        }

        if (planId === 'FREE') {
            router.push('/subscription');
            return;
        }

        try {
            setLoading(planId);
            router.push(`/checkout?plan=${planId}&billing=${isAnnual ? 'annual' : 'monthly'}`);
        } finally {
            setLoading(null);
        }
    };

    const getPrice = (plan: PlanPricing) => {
        if (plan.monthlyPrice === 0) return '$0';
        return isAnnual
            ? `$${(plan.yearlyPrice / 12).toFixed(2)}`
            : `$${plan.monthlyPrice}`;
    };

    const getSavings = (plan: PlanPricing) => {
        if (plan.monthlyPrice === 0) return null;
        const monthlyCost = plan.monthlyPrice * 12;
        const savings = monthlyCost - plan.yearlyPrice;
        return savings.toFixed(0);
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1>Choose Your Plan</h1>
                <p>Unlock the full Netflop experience. Cancel anytime.</p>
            </div>

            {/* Billing Toggle */}
            <div className={styles.billingToggle}>
                <span className={!isAnnual ? styles.active : ''}>Monthly</span>
                <button
                    className={styles.toggle}
                    onClick={() => setIsAnnual(!isAnnual)}
                    aria-label="Toggle annual billing"
                >
                    <span className={`${styles.toggleKnob} ${isAnnual ? styles.toggleOn : ''}`} />
                </button>
                <span className={isAnnual ? styles.active : ''}>
                    Annual
                    <span className={styles.saveBadge}>Save 20%</span>
                </span>
            </div>

            {/* Plans Grid */}
            <div className={styles.plansGrid}>
                {displayPlans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}
                    >
                        {plan.popular && (
                            <div className={styles.popularBadge}>Most Popular</div>
                        )}

                        <div className={styles.planHeader}>
                            <h3>{plan.name}</h3>
                            <div className={styles.price}>
                                <span className={styles.amount}>{getPrice(plan)}</span>
                                <span className={styles.period}>/month</span>
                            </div>
                            {isAnnual && getSavings(plan) && (
                                <div className={styles.savings}>
                                    Save ${getSavings(plan)}/year
                                </div>
                            )}
                        </div>

                        <ul className={styles.features}>
                            {plan.features.map((feature, i) => (
                                <li key={i} className={feature.included ? styles.included : styles.notIncluded}>
                                    <span className={styles.icon}>
                                        {feature.included ? '✓' : '×'}
                                    </span>
                                    {feature.text}
                                </li>
                            ))}
                        </ul>

                        <button
                            className={`${styles.subscribeBtn} ${plan.popular ? styles.primaryBtn : ''}`}
                            onClick={() => handleSubscribe(plan.id)}
                            disabled={loading === plan.id}
                        >
                            {loading === plan.id ? 'Processing...' :
                                plan.id === 'FREE' ? 'Current Plan' : 'Get Started'}
                        </button>
                    </div>
                ))}
            </div>
            {plansLoading && (
                <p className={styles.muted} style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                    Loading latest plan pricing...
                </p>
            )}
            {plansError && !plansLoading && (
                <p className={styles.muted} style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                    {plansError}
                </p>
            )}

            {/* Comparison Table */}
            <div className={styles.comparison}>
                <h2>Compare Features</h2>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th>Free</th>
                                <th className={styles.highlightCol}>Basic</th>
                                <th>Premium</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Video Quality</td>
                                <td>480p SD</td>
                                <td className={styles.highlightCol}>720p HD</td>
                                <td>4K + HDR</td>
                            </tr>
                            <tr>
                                <td>Simultaneous Streams</td>
                                <td>1</td>
                                <td className={styles.highlightCol}>2</td>
                                <td>4</td>
                            </tr>
                            <tr>
                                <td>Downloads</td>
                                <td>—</td>
                                <td className={styles.highlightCol}>2 devices</td>
                                <td>6 devices</td>
                            </tr>
                            <tr>
                                <td>Ad-Free</td>
                                <td>—</td>
                                <td className={styles.highlightCol}>✓</td>
                                <td>✓</td>
                            </tr>
                            <tr>
                                <td>Spatial Audio</td>
                                <td>—</td>
                                <td className={styles.highlightCol}>—</td>
                                <td>✓</td>
                            </tr>
                            <tr>
                                <td>Extra Members</td>
                                <td>—</td>
                                <td className={styles.highlightCol}>1 add-on</td>
                                <td>2 add-ons</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FAQ */}
            <div className={styles.faq}>
                <h2>Frequently Asked Questions</h2>
                <div className={styles.faqList}>
                    {FAQ.map((item, index) => (
                        <div
                            key={index}
                            className={`${styles.faqItem} ${openFaq === index ? styles.faqOpen : ''}`}
                        >
                            <button
                                className={styles.faqQuestion}
                                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                            >
                                {item.question}
                                <span className={styles.faqArrow}>
                                    {openFaq === index ? '−' : '+'}
                                </span>
                            </button>
                            {openFaq === index && (
                                <div className={styles.faqAnswer}>
                                    {item.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
