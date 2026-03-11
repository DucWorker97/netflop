'use client';

import { useDeferredValue, useState } from 'react';
import Image from 'next/image';
import styles from './actors.module.css';
import {
    useActors,
    useCreateActor,
    useUpdateActor,
    useDeleteActor,
    type Actor,
} from '@/lib/queries';

export default function ActorsPage() {
    const { data: actors = [], isLoading, error } = useActors();
    const createActor = useCreateActor();
    const updateActor = useUpdateActor();
    const deleteActor = useDeleteActor();

    const [showAddModal, setShowAddModal] = useState(false);
    const [newActor, setNewActor] = useState({ name: '', avatarUrl: '' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearchQuery = useDeferredValue(searchQuery);

    const filteredActors = actors.filter((actor) =>
        actor.name.toLowerCase().includes(deferredSearchQuery.toLowerCase())
    );

    async function handleAdd() {
        const name = newActor.name.trim();
        if (!name) return;

        try {
            await createActor.mutateAsync({
                name,
                avatarUrl: newActor.avatarUrl.trim() || undefined,
            });
            setNewActor({ name: '', avatarUrl: '' });
            setShowAddModal(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create actor');
        }
    }

    async function handleUpdate(id: string) {
        const name = editingName.trim();
        if (!name) return;

        try {
            await updateActor.mutateAsync({
                id,
                input: { name },
            });
            setEditingId(null);
            setEditingName('');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update actor');
        }
    }

    async function handleDelete(actor: Actor) {
        if (!confirm(`Delete "${actor.name}"?`)) return;

        try {
            await deleteActor.mutateAsync(actor.id);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete actor');
        }
    }

    if (isLoading) {
        return (
            <div>
                <div className={styles.header}>
                    <h1>Actors Management</h1>
                </div>
                <div className="skeleton" style={{ height: 280 }} />
            </div>
        );
    }

    return (
        <div>
            <div className={styles.header}>
                <h1>Actors Management</h1>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    + Add Actor
                </button>
            </div>

            <div className={styles.searchContainer}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search actors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {error && (
                <div className={styles.empty}>
                    <p>{error instanceof Error ? error.message : 'Failed to load actors'}</p>
                </div>
            )}

            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{actors.length}</div>
                    <div className={styles.statLabel}>Total Actors</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>
                        {actors.reduce((sum, actor) => sum + actor.movieCount, 0)}
                    </div>
                    <div className={styles.statLabel}>Movie Appearances</div>
                </div>
            </div>

            <div className={styles.grid}>
                {filteredActors.map((actor) => (
                    <div key={actor.id} className={styles.card}>
                        <div className={styles.avatar}>
                            {actor.avatarUrl ? (
                                <Image
                                    src={actor.avatarUrl}
                                    alt={actor.name}
                                    width={80}
                                    height={80}
                                    className={styles.avatarImage}
                                />
                            ) : (
                                <span>{actor.name.charAt(0).toUpperCase()}</span>
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
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleUpdate(actor.id)}
                                        disabled={updateActor.isPending}
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setEditingId(null);
                                            setEditingName('');
                                        }}
                                    >
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
                                        Edit
                                    </button>
                                    <button
                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                        onClick={() => handleDelete(actor)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {!error && filteredActors.length === 0 && (
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>Actors</span>
                    <p>No actors found</p>
                </div>
            )}

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
                                onChange={(e) => setNewActor((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Actor name"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Avatar URL</label>
                            <input
                                type="url"
                                className="input"
                                value={newActor.avatarUrl}
                                onChange={(e) => setNewActor((prev) => ({ ...prev, avatarUrl: e.target.value }))}
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
                                disabled={!newActor.name.trim() || createActor.isPending}
                            >
                                {createActor.isPending ? 'Adding...' : 'Add Actor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
