'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useSubscriptionsOverview } from '@/lib/queries';
import styles from './subscriptions.module.css';

const FILTERS = ['all', 'free', 'basic', 'premium', 'active', 'canceled', 'past_due'] as const;

const EMPTY_STATS = {
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscribers: 0,
    churnRate: 0,
    byPlan: {
        FREE: 0,
        BASIC: 0,
        PREMIUM: 0,
    },
};

function formatDate(dateStr: string | null) {
    if (!dateStr) return '-';

    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

function getBarWidth(value: number, total: number) {
    if (!total) return '0%';
    return `${(value / total) * 100}%`;
}

export default function AdminSubscriptionsPage() {
    const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const { data, isLoading, error } = useSubscriptionsOverview();

    const subscribers = useMemo(() => data?.subscribers ?? [], [data?.subscribers]);
    const stats = data?.stats ?? EMPTY_STATS;
    const totalByPlan = stats.byPlan.FREE + stats.byPlan.BASIC + stats.byPlan.PREMIUM;

    const filteredSubscribers = useMemo(() => {
        const searchValue = deferredSearch.trim().toLowerCase();

        return subscribers.filter((subscriber) => {
            const matchesFilter =
                filter === 'all' ||
                subscriber.plan.toLowerCase() === filter ||
                subscriber.status.toLowerCase() === filter;
            const matchesSearch =
                !searchValue ||
                subscriber.email.toLowerCase().includes(searchValue) ||
                subscriber.name.toLowerCase().includes(searchValue);

            return matchesFilter && matchesSearch;
        });
    }, [deferredSearch, filter, subscribers]);

    function exportCsv() {
        if (subscribers.length === 0) return;

        const header = ['Name', 'Email', 'Plan', 'Status', 'Start Date', 'End Date', 'Total Paid'];
        const rows = subscribers.map((subscriber) => [
            subscriber.name,
            subscriber.email,
            subscriber.plan,
            subscriber.status,
            subscriber.startDate,
            subscriber.endDate ?? '',
            subscriber.totalPaid.toFixed(2),
        ]);

        const csvContent = [header, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'subscriptions.csv';
        link.click();

        window.URL.revokeObjectURL(url);
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Subscriptions</h1>
                <button
                    className={styles.exportBtn}
                    onClick={exportCsv}
                    disabled={subscribers.length === 0}
                >
                    Export CSV
                </button>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>$</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</span>
                        <span className={styles.statLabel}>Total Revenue</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>M</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{formatCurrency(stats.monthlyRevenue)}</span>
                        <span className={styles.statLabel}>This Month</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>U</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.activeSubscribers}</span>
                        <span className={styles.statLabel}>Active Subscribers</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>%</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.churnRate}%</span>
                        <span className={styles.statLabel}>Churn Rate</span>
                    </div>
                </div>
            </div>

            <div className={styles.distributionCard}>
                <h3>Subscribers by Plan</h3>
                <div className={styles.planBars}>
                    <div className={styles.planBar}>
                        <div className={styles.planInfo}>
                            <span>Free</span>
                            <span>{stats.byPlan.FREE}</span>
                        </div>
                        <div className={styles.barTrack}>
                            <div
                                className={`${styles.barFill} ${styles.free}`}
                                style={{ width: getBarWidth(stats.byPlan.FREE, totalByPlan) }}
                            />
                        </div>
                    </div>
                    <div className={styles.planBar}>
                        <div className={styles.planInfo}>
                            <span>Basic</span>
                            <span>{stats.byPlan.BASIC}</span>
                        </div>
                        <div className={styles.barTrack}>
                            <div
                                className={`${styles.barFill} ${styles.basic}`}
                                style={{ width: getBarWidth(stats.byPlan.BASIC, totalByPlan) }}
                            />
                        </div>
                    </div>
                    <div className={styles.planBar}>
                        <div className={styles.planInfo}>
                            <span>Premium</span>
                            <span>{stats.byPlan.PREMIUM}</span>
                        </div>
                        <div className={styles.barTrack}>
                            <div
                                className={`${styles.barFill} ${styles.premium}`}
                                style={{ width: getBarWidth(stats.byPlan.PREMIUM, totalByPlan) }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.filters}>
                    {FILTERS.map((value) => (
                        <button
                            key={value}
                            className={`${styles.filterBtn} ${filter === value ? styles.filterActive : ''}`}
                            onClick={() => setFilter(value)}
                        >
                            {value.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.tableContainer}>
                {isLoading ? (
                    <div className={styles.loading}>Loading subscriptions...</div>
                ) : error ? (
                    <div className={styles.loading}>
                        {error instanceof Error ? error.message : 'Failed to load subscriptions'}
                    </div>
                ) : filteredSubscribers.length === 0 ? (
                    <div className={styles.loading}>No subscribers match the current filters.</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Plan</th>
                                <th>Status</th>
                                <th>Start Date</th>
                                <th>Next Billing</th>
                                <th>Total Paid</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubscribers.map((subscriber) => (
                                <tr key={subscriber.id}>
                                    <td>
                                        <div className={styles.userCell}>
                                            <div className={styles.avatar}>
                                                {subscriber.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className={styles.userName}>{subscriber.name}</div>
                                                <div className={styles.userEmail}>{subscriber.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className={`${styles.planBadge} ${styles[subscriber.plan.toLowerCase()]}`}
                                        >
                                            {subscriber.plan}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={`${styles.statusBadge} ${styles[subscriber.status.toLowerCase().replace('_', '')]}`}
                                        >
                                            {subscriber.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>{formatDate(subscriber.startDate)}</td>
                                    <td>{formatDate(subscriber.endDate)}</td>
                                    <td>{formatCurrency(subscriber.totalPaid)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
