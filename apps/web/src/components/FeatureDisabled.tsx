'use client';

import Link from 'next/link';

interface FeatureDisabledProps {
    title?: string;
    message?: string;
}

export function FeatureDisabled({
    title = 'Feature temporarily paused',
    message = 'This screen is paused while we focus on core streaming features.',
}: FeatureDisabledProps) {
    return (
        <div style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--text-secondary)',
        }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', margin: 0 }}>
                {title}
            </h2>
            <p style={{ maxWidth: 480, margin: 0 }}>
                {message}
            </p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                Back to Home
            </Link>
        </div>
    );
}
