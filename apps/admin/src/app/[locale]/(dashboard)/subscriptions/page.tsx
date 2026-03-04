'use client';

import { useState, useEffect } from 'react';
import styles from './subscriptions.module.css';

interface Subscriber {
    id: string;
    email: string;
    name: string;
    plan: 'FREE' | 'BASIC' | 'PREMIUM';
    status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
    startDate: string;
    endDate: string | null;
    totalPaid: number;
}

const mockSubscribers: Subscriber[] = [
    { id: '1', email: 'john@example.com', name: 'John Doe', plan: 'PREMIUM', status: 'ACTIVE', startDate: '2026-01-01', endDate: '2026-02-01', totalPaid: 47.97 },
    { id: '2', email: 'jane@example.com', name: 'Jane Smith', plan: 'BASIC', status: 'ACTIVE', startDate: '2026-01-15', endDate: '2026-02-15', totalPaid: 19.98 },
    { id: '3', email: 'bob@example.com', name: 'Bob Wilson', plan: 'BASIC', status: 'CANCELED', startDate: '2025-11-01', endDate: '2026-01-01', totalPaid: 19.98 },
    { id: '4', email: 'alice@example.com', name: 'Alice Brown', plan: 'PREMIUM', status: 'PAST_DUE', startDate: '2025-12-01', endDate: '2026-01-01', totalPaid: 15.99 },
];

const mockStats = {
    totalRevenue: 2459.87,
    monthlyRevenue: 345.67,
    activeSubscribers: 156,
    churnRate: 2.3,
    byPlan: { FREE: 423, BASIC: 98, PREMIUM: 58 },
};

export default function AdminSubscriptionsPage() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [stats, setStats] = useState(mockStats);
    const [filter, setFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setSubscribers(mockSubscribers);
            setLoading(false);
        }, 500);
    }, []);

    const filteredSubscribers = subscribers.filter(sub => {
        const matchesFilter = filter === 'all' || sub.plan.toLowerCase() === filter || sub.status.toLowerCase() === filter;
        const matchesSearch = sub.email.toLowerCase().includes(search.toLowerCase()) ||
            sub.name.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Subscriptions</h1>
                <button className={styles.exportBtn}>
                    📥 Export CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>💰</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</span>
                        <span className={styles.statLabel}>Total Revenue</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>📈</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{formatCurrency(stats.monthlyRevenue)}</span>
                        <span className={styles.statLabel}>This Month</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>👥</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.activeSubscribers}</span>
                        <span className={styles.statLabel}>Active Subscribers</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>📉</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.churnRate}%</span>
                        <span className={styles.statLabel}>Churn Rate</span>
                    </div>
                </div>
            </div>

            {/* Plan Distribution */}
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
                                style={{ width: `${(stats.byPlan.FREE / (stats.byPlan.FREE + stats.byPlan.BASIC + stats.byPlan.PREMIUM)) * 100}%` }}
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
                                style={{ width: `${(stats.byPlan.BASIC / (stats.byPlan.FREE + stats.byPlan.BASIC + stats.byPlan.PREMIUM)) * 100}%` }}
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
                                style={{ width: `${(stats.byPlan.PREMIUM / (stats.byPlan.FREE + stats.byPlan.BASIC + stats.byPlan.PREMIUM)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className={styles.toolbar}>
                <div className={styles.filters}>
                    {['all', 'basic', 'premium', 'active', 'canceled'].map(f => (
                        <button
                            key={f}
                            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {/* Subscribers Table */}
            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.loading}>Loading...</div>
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
                            {filteredSubscribers.map(sub => (
                                <tr key={sub.id}>
                                    <td>
                                        <div className={styles.userCell}>
                                            <div className={styles.avatar}>
                                                {sub.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className={styles.userName}>{sub.name}</div>
                                                <div className={styles.userEmail}>{sub.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.planBadge} ${styles[sub.plan.toLowerCase()]}`}>
                                            {sub.plan}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[sub.status.toLowerCase().replace('_', '')]}`}>
                                            {sub.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>{formatDate(sub.startDate)}</td>
                                    <td>{sub.endDate ? formatDate(sub.endDate) : '—'}</td>
                                    <td>{formatCurrency(sub.totalPaid)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
