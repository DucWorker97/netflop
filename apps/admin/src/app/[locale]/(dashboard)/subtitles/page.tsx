'use client';

import styles from './subtitles.module.css';

export default function SubtitlesPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Subtitle Management</h1>
                <p className={styles.subtitle}>Upload and manage subtitles for movies</p>
            </div>

            <div className={styles.emptyState}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
                <h2 style={{ marginBottom: '0.5rem', color: '#fff' }}>Coming Soon</h2>
                <p style={{ color: '#888', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                    Subtitle management is under development. You will be able to upload VTT/SRT files,
                    manage languages, and auto-sync subtitles with movies.
                </p>
            </div>
        </div>
    );
}
