'use client';

import { useState } from 'react';
import styles from './subtitles.module.css';

interface Subtitle {
    id: string;
    movieId: string;
    movieTitle: string;
    language: string;
    languageCode: string;
    fileName: string;
    uploadedAt: string;
}

const mockSubtitles: Subtitle[] = [
    { id: '1', movieId: 'm1', movieTitle: 'Dune: Part Two', language: 'English', languageCode: 'en', fileName: 'dune2_en.vtt', uploadedAt: '2024-01-15' },
    { id: '2', movieId: 'm1', movieTitle: 'Dune: Part Two', language: 'Vietnamese', languageCode: 'vi', fileName: 'dune2_vi.vtt', uploadedAt: '2024-01-16' },
    { id: '3', movieId: 'm2', movieTitle: 'Oppenheimer', language: 'English', languageCode: 'en', fileName: 'oppenheimer_en.vtt', uploadedAt: '2024-01-17' },
];

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
];

export default function SubtitlesPage() {
    const [subtitles, setSubtitles] = useState<Subtitle[]>(mockSubtitles);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [languageFilter, setLanguageFilter] = useState('all');
    const [newSubtitle, setNewSubtitle] = useState({
        movieId: '',
        movieTitle: '',
        languageCode: 'en',
        file: null as File | null,
    });

    const filteredSubtitles = subtitles.filter(s => {
        const matchesSearch = s.movieTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLang = languageFilter === 'all' || s.languageCode === languageFilter;
        return matchesSearch && matchesLang;
    });

    const handleDelete = (id: string) => {
        if (confirm('Delete this subtitle file?')) {
            setSubtitles(subtitles.filter(s => s.id !== id));
        }
    };

    const handleUpload = () => {
        if (!newSubtitle.movieId || !newSubtitle.file) return;

        const lang = LANGUAGES.find(l => l.code === newSubtitle.languageCode);
        const subtitle: Subtitle = {
            id: Date.now().toString(),
            movieId: newSubtitle.movieId,
            movieTitle: newSubtitle.movieTitle || 'Movie Title',
            language: lang?.name || 'Unknown',
            languageCode: newSubtitle.languageCode,
            fileName: newSubtitle.file.name,
            uploadedAt: new Date().toISOString(),
        };

        setSubtitles([...subtitles, subtitle]);
        setNewSubtitle({ movieId: '', movieTitle: '', languageCode: 'en', file: null });
        setShowUploadModal(false);
    };

    // Group by movie
    const groupedByMovie = filteredSubtitles.reduce((acc, sub) => {
        if (!acc[sub.movieId]) {
            acc[sub.movieId] = { title: sub.movieTitle, subtitles: [] };
        }
        acc[sub.movieId].subtitles.push(sub);
        return acc;
    }, {} as Record<string, { title: string; subtitles: Subtitle[] }>);

    return (
        <div>
            <div className={styles.header}>
                <h1>📝 Subtitles Management</h1>
                <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                    + Upload Subtitle
                </button>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search by movie title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                    className={styles.langFilter}
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                >
                    <option value="all">All Languages</option>
                    {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                </select>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{subtitles.length}</div>
                    <div className={styles.statLabel}>Total Subtitles</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{Object.keys(groupedByMovie).length}</div>
                    <div className={styles.statLabel}>Movies with Subtitles</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>
                        {new Set(subtitles.map(s => s.languageCode)).size}
                    </div>
                    <div className={styles.statLabel}>Languages</div>
                </div>
            </div>

            {/* Grouped List */}
            {Object.entries(groupedByMovie).length === 0 ? (
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>📝</span>
                    <p>No subtitles found</p>
                </div>
            ) : (
                Object.entries(groupedByMovie).map(([movieId, data]) => (
                    <div key={movieId} className={styles.movieGroup}>
                        <h3 className={styles.movieTitle}>🎬 {data.title}</h3>
                        <div className={styles.subtitleList}>
                            {data.subtitles.map(sub => (
                                <div key={sub.id} className={styles.subtitleItem}>
                                    <div className={styles.langBadge}>{sub.languageCode.toUpperCase()}</div>
                                    <div className={styles.subtitleInfo}>
                                        <span className={styles.language}>{sub.language}</span>
                                        <span className={styles.fileName}>{sub.fileName}</span>
                                    </div>
                                    <div className={styles.uploadDate}>
                                        {new Date(sub.uploadedAt).toLocaleDateString()}
                                    </div>
                                    <div className={styles.actions}>
                                        <button className={styles.downloadBtn}>⬇️ Download</button>
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => handleDelete(sub.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>Upload Subtitle</h2>

                        <div className={styles.formGroup}>
                            <label>Movie *</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Enter movie title or ID"
                                value={newSubtitle.movieTitle}
                                onChange={(e) => setNewSubtitle(prev => ({
                                    ...prev,
                                    movieTitle: e.target.value,
                                    movieId: e.target.value // simplified for demo
                                }))}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Language *</label>
                            <select
                                className="input"
                                value={newSubtitle.languageCode}
                                onChange={(e) => setNewSubtitle(prev => ({ ...prev, languageCode: e.target.value }))}
                            >
                                {LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>VTT File *</label>
                            <input
                                type="file"
                                accept=".vtt"
                                className={styles.fileInput}
                                onChange={(e) => setNewSubtitle(prev => ({
                                    ...prev,
                                    file: e.target.files?.[0] || null
                                }))}
                            />
                            <span className={styles.hint}>WebVTT format only (.vtt)</span>
                        </div>

                        <div className={styles.modalActions}>
                            <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleUpload}
                                disabled={!newSubtitle.movieTitle || !newSubtitle.file}
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
