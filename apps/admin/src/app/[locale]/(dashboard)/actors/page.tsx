'use client';

import { useState } from 'react';
import styles from './actors.module.css';

interface Actor {
    id: string;
    name: string;
    avatarUrl: string | null;
    movieCount: number;
    createdAt: string;
}

const mockActors: Actor[] = [
    { id: '1', name: 'Robert Downey Jr.', avatarUrl: null, movieCount: 12, createdAt: '2024-01-15' },
    { id: '2', name: 'Scarlett Johansson', avatarUrl: null, movieCount: 8, createdAt: '2024-01-16' },
    { id: '3', name: 'Chris Evans', avatarUrl: null, movieCount: 10, createdAt: '2024-01-17' },
    { id: '4', name: 'Timothée Chalamet', avatarUrl: null, movieCount: 5, createdAt: '2024-01-18' },
];

export default function ActorsPage() {
    const [actors, setActors] = useState<Actor[]>(mockActors);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newActor, setNewActor] = useState({ name: '', avatarUrl: '' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredActors = actors.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAdd = () => {
        if (!newActor.name.trim()) return;
        const actor: Actor = {
            id: Date.now().toString(),
            name: newActor.name,
            avatarUrl: newActor.avatarUrl || null,
            movieCount: 0,
            createdAt: new Date().toISOString(),
        };
        setActors([...actors, actor]);
        setNewActor({ name: '', avatarUrl: '' });
        setShowAddModal(false);
    };

    const handleUpdate = (id: string) => {
        setActors(actors.map(a =>
            a.id === id ? { ...a, name: editingName } : a
        ));
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this actor?')) {
            setActors(actors.filter(a => a.id !== id));
        }
    };

    return (
        <div>
            <div className={styles.header}>
                <h1>👤 Actors Management</h1>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    + Add Actor
                </button>
            </div>

            {/* Search */}
            <div className={styles.searchContainer}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search actors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{actors.length}</div>
                    <div className={styles.statLabel}>Total Actors</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>
                        {actors.reduce((sum, a) => sum + a.movieCount, 0)}
                    </div>
                    <div className={styles.statLabel}>Movie Appearances</div>
                </div>
            </div>

            {/* Actors Grid */}
            <div className={styles.grid}>
                {filteredActors.map((actor) => (
                    <div key={actor.id} className={styles.card}>
                        <div className={styles.avatar}>
                            {actor.avatarUrl ? (
                                <img src={actor.avatarUrl} alt={actor.name} />
                            ) : (
                                <span>{actor.name.charAt(0)}</span>
                            )}
                        </div>

                        {editingId === actor.id ? (
                            <div className={styles.editForm}>
                                <input
                                    type="text"
                                    className="input"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    autoFocus
                                />
                                <div className={styles.editActions}>
                                    <button className="btn btn-primary" onClick={() => handleUpdate(actor.id)}>
                                        Save
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => setEditingId(null)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className={styles.name}>{actor.name}</h3>
                                <div className={styles.movieCount}>{actor.movieCount} movies</div>
                                <div className={styles.actions}>
                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => {
                                            setEditingId(actor.id);
                                            setEditingName(actor.name);
                                        }}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                        onClick={() => handleDelete(actor.id)}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredActors.length === 0 && (
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>🎭</span>
                    <p>No actors found</p>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>Add New Actor</h2>

                        <div className={styles.formGroup}>
                            <label>Name *</label>
                            <input
                                type="text"
                                className="input"
                                value={newActor.name}
                                onChange={(e) => setNewActor(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Actor name"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Avatar URL</label>
                            <input
                                type="url"
                                className="input"
                                value={newActor.avatarUrl}
                                onChange={(e) => setNewActor(prev => ({ ...prev, avatarUrl: e.target.value }))}
                                placeholder="https://..."
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAdd}
                                disabled={!newActor.name.trim()}
                            >
                                Add Actor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
