'use client';

import Link from 'next/link';
import styles from './coming-soon.module.css';
import { FeatureDisabled } from '@/components/FeatureDisabled';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

export default function ComingSoonPage() {
    if (!FEATURE_FLAGS.comingSoon) {
        return <FeatureDisabled title="Coming Soon is paused" message="This screen is temporarily disabled while we focus on core streaming." />;
    }

    return (
        <div className={styles.container}>
            <nav className={styles.navbar}>
                <Link href="/" className={styles.logo}>NETFLOP</Link>
                <Link href="/" className={styles.backLink}>← Back to Browse</Link>
            </nav>

            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>🎬 Coming Soon</h1>
                    <p className={styles.subtitle}>Get notified when new movies are available</p>
                </div>

                <div style={{ textAlign: 'center', color: '#888', padding: '4rem 1rem' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</p>
                    <p>No upcoming releases at this time.</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Check back later for new content announcements.</p>
                </div>
            </main>
        </div>
    );
}
