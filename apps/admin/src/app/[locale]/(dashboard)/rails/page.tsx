'use client';

import { useState } from 'react';
import { useRails, useReorderRails, useDeleteRail, useSeedRails, useGenres, useCreateRail } from '@/lib/queries';

const RAIL_TYPES = [
    { value: 'continue_watching', label: 'Continue Watching' },
    { value: 'for_you', label: 'For You' },
    { value: 'trending', label: 'Trending' },
    { value: 'recent', label: 'Recently Added' },
    { value: 'genre', label: 'Genre' },
];

export default function RailsPage() {
    const { data: rails, isLoading } = useRails();
    const { data: genres } = useGenres();
    const reorderMutation = useReorderRails();
    const deleteMutation = useDeleteRail();
    const seedMutation = useSeedRails();
    const createMutation = useCreateRail();

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [localRails, setLocalRails] = useState<typeof rails>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRail, setNewRail] = useState({ name: '', type: 'genre', genreId: '' });

    // Sync local rails with API data
    if (rails && localRails.length === 0 && rails.length > 0) {
        setLocalRails(rails);
    }

    const handleDragStart = (id: string) => {
        setDraggingId(id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggingId || draggingId === targetId) return;

        const newRails = [...(localRails || [])];
        const dragIndex = newRails.findIndex(r => r.id === draggingId);
        const targetIndex = newRails.findIndex(r => r.id === targetId);

        if (dragIndex !== -1 && targetIndex !== -1) {
            const [removed] = newRails.splice(dragIndex, 1);
            newRails.splice(targetIndex, 0, removed);
            setLocalRails(newRails);
        }
    };

    const handleDragEnd = () => {
        if (localRails) {
            reorderMutation.mutate(localRails.map(r => r.id));
        }
        setDraggingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this rail?')) {
            deleteMutation.mutate(id);
            setLocalRails(prev => prev?.filter(r => r.id !== id) || []);
        }
    };

    const handleSeed = () => {
        seedMutation.mutate();
    };

    const handleAddRail = () => {
        createMutation.mutate(
            {
                name: newRail.name,
                type: newRail.type,
                genreId: newRail.type === 'genre' ? newRail.genreId : undefined,
            },
            {
                onSuccess: (data) => {
                    setLocalRails(prev => [...(prev || []), data]);
                    setShowAddModal(false);
                    setNewRail({ name: '', type: 'genre', genreId: '' });
                },
            }
        );
    };

    if (isLoading) {
        return (
            <div>
                <h1 style={{ marginBottom: '2rem' }}>Manage Rails</h1>
                <div className="skeleton" style={{ height: 400 }} />
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Manage Rails</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {(!rails || rails.length === 0) && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleSeed}
                            disabled={seedMutation.isPending}
                        >
                            {seedMutation.isPending ? 'Seeding...' : '🌱 Seed Default Rails'}
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        + Add Rail
                    </button>
                </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Drag and drop to reorder rails. Changes are saved automatically.
            </p>

            <div style={{ background: 'var(--bg-card)', borderRadius: 8, overflow: 'hidden' }}>
                {(localRails || []).length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No rails configured. Click "Seed Default Rails" or "Add Rail" to get started.
                    </div>
                ) : (
                    (localRails || []).map((rail, index) => (
                        <div
                            key={rail.id}
                            draggable
                            onDragStart={() => handleDragStart(rail.id)}
                            onDragOver={(e) => handleDragOver(e, rail.id)}
                            onDragEnd={handleDragEnd}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                borderBottom: '1px solid var(--border)',
                                cursor: 'grab',
                                background: draggingId === rail.id ? 'var(--bg-secondary)' : 'transparent',
                                opacity: draggingId === rail.id ? 0.5 : 1,
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', cursor: 'grab' }}>☰</span>
                            <span style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                            }}>
                                {index + 1}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500 }}>{rail.name}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Type: {rail.type}
                                    {rail.genre && ` • Genre: ${rail.genre.name}`}
                                </div>
                            </div>
                            <span
                                className={`badge ${rail.isActive ? 'badge-ready' : 'badge-draft'}`}
                            >
                                {rail.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <button
                                className="btn btn-secondary"
                                style={{ padding: '0.5rem' }}
                                onClick={() => handleDelete(rail.id)}
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add Rail Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: 12,
                        padding: '2rem',
                        width: '100%',
                        maxWidth: 400,
                    }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Add New Rail</h2>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="label">Name</label>
                            <input
                                type="text"
                                className="input"
                                value={newRail.name}
                                onChange={(e) => setNewRail(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Rail name"
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="label">Type</label>
                            <select
                                className="input"
                                value={newRail.type}
                                onChange={(e) => setNewRail(prev => ({ ...prev, type: e.target.value }))}
                            >
                                {RAIL_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        {newRail.type === 'genre' && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Genre</label>
                                <select
                                    className="input"
                                    value={newRail.genreId}
                                    onChange={(e) => setNewRail(prev => ({ ...prev, genreId: e.target.value }))}
                                >
                                    <option value="">Select genre...</option>
                                    {genres?.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowAddModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddRail}
                                disabled={!newRail.name || createMutation.isPending}
                            >
                                {createMutation.isPending ? 'Adding...' : 'Add Rail'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
