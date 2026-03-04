'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useMovieRatingStats, useMovieReviews, useRateMovie, useUserRating, type MovieReview } from '@/lib/queries';
import { Stars } from '@/components/stars';
import styles from './ReviewsModal.module.css';

interface ReviewsModalProps {
    movieId: string;
    movieTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ReviewsModal({ movieId, movieTitle, isOpen, onClose }: ReviewsModalProps) {
    const { isAuthenticated } = useAuth();
    const { data: ratingStats } = useMovieRatingStats(movieId);
    const { data: userRating } = useUserRating(movieId, isAuthenticated);
    const { data: reviews, isLoading, error } = useMovieReviews(movieId, 50);
    const rateMovie = useRateMovie();
    const [sortBy, setSortBy] = useState<'newest' | 'rating'>('newest');
    const [commentText, setCommentText] = useState('');
    const [selectedRating, setSelectedRating] = useState(0);

    // Initialize selected rating from user's existing rating
    const effectiveRating = selectedRating || userRating?.rating || 0;

    const sortedReviews = useMemo(() => {
        const data = reviews ? [...reviews] : [];
        if (sortBy === 'rating') {
            return data.sort((a, b) => b.rating - a.rating);
        }
        return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [reviews, sortBy]);

    // Stats for rating distribution
    const ratingDistribution = useMemo(() => {
        if (!reviews || reviews.length === 0) return [0, 0, 0, 0, 0];
        const dist = [0, 0, 0, 0, 0]; // index 0 = 1-star, etc.
        reviews.forEach(r => { dist[r.rating - 1]++; });
        return dist;
    }, [reviews]);

    if (!isOpen) return null;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return date.toLocaleDateString();
    };

    const handleSubmitReview = () => {
        if (effectiveRating === 0) return;
        rateMovie.mutate({
            movieId,
            rating: effectiveRating,
            comment: commentText.trim() || undefined,
        });
        setCommentText('');
        setSelectedRating(0);
    };

    const avgRating = ratingStats?.avgRating;
    const ratingsCount = ratingStats?.ratingsCount ?? reviews?.length ?? 0;
    const maxDist = Math.max(...ratingDistribution, 1);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h2>Reviews</h2>
                        <p className={styles.movieTitleSub}>{movieTitle}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Rating Summary */}
                <div className={styles.ratingSummary}>
                    <div className={styles.ratingBig}>
                        <span className={styles.ratingNumber}>
                            {avgRating !== null && avgRating !== undefined ? avgRating.toFixed(1) : '—'}
                        </span>
                        <Stars rating={avgRating || 0} size="medium" />
                        <span className={styles.ratingCount}>{ratingsCount} reviews</span>
                    </div>
                    <div className={styles.ratingBars}>
                        {[5, 4, 3, 2, 1].map(star => (
                            <div key={star} className={styles.barRow}>
                                <span className={styles.barLabel}>{star}★</span>
                                <div className={styles.barTrack}>
                                    <div
                                        className={styles.barFill}
                                        style={{ width: `${(ratingDistribution[star - 1] / maxDist) * 100}%` }}
                                    />
                                </div>
                                <span className={styles.barCount}>{ratingDistribution[star - 1]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Write Review */}
                <div className={styles.writeReview}>
                    <h3>Write a Review</h3>
                    {isAuthenticated ? (
                        <>
                            <div className={styles.ratingRow}>
                                <span className={styles.ratingLabel}>Your rating:</span>
                                <Stars
                                    rating={effectiveRating}
                                    onRate={(r) => setSelectedRating(r)}
                                    size="large"
                                />
                                {effectiveRating > 0 && (
                                    <span className={styles.ratingValue}>{effectiveRating}/5</span>
                                )}
                            </div>
                            <textarea
                                className={styles.textarea}
                                placeholder="Share your thoughts about this movie... (optional)"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                rows={3}
                                maxLength={2000}
                            />
                            <div className={styles.submitRow}>
                                <span className={styles.charCount}>
                                    {commentText.length}/2000
                                </span>
                                <button
                                    className={styles.submitBtn}
                                    onClick={handleSubmitReview}
                                    disabled={effectiveRating === 0 || rateMovie.isPending}
                                >
                                    {rateMovie.isPending ? 'Submitting...' : userRating?.rating ? 'Update Review' : 'Submit Review'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.signInPrompt}>
                            <p>Sign in to rate and review this movie</p>
                            <Link href="/login" className={styles.submitBtn}>
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>

                {/* Sort */}
                <div className={styles.sort}>
                    <span className={styles.sortLabel}>Sort by:</span>
                    <button
                        className={sortBy === 'newest' ? styles.sortActive : ''}
                        onClick={() => setSortBy('newest')}
                    >
                        Newest
                    </button>
                    <button
                        className={sortBy === 'rating' ? styles.sortActive : ''}
                        onClick={() => setSortBy('rating')}
                    >
                        Top Rated
                    </button>
                </div>

                {/* Reviews List */}
                <div className={styles.reviewsList}>
                    {isLoading && (
                        <div className={styles.loadingState}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className={styles.skeletonCard}>
                                    <div className={styles.skeletonAvatar} />
                                    <div className={styles.skeletonLines}>
                                        <div className={styles.skeletonLine} style={{ width: '40%' }} />
                                        <div className={styles.skeletonLine} style={{ width: '80%' }} />
                                        <div className={styles.skeletonLine} style={{ width: '60%' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {error && !isLoading && (
                        <div className={styles.emptyState}>Unable to load reviews.</div>
                    )}
                    {!isLoading && !error && sortedReviews.length === 0 && (
                        <div className={styles.emptyState}>
                            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ opacity: 0.3 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p>No reviews yet</p>
                            <p style={{ fontSize: '0.8rem' }}>Be the first to share your thoughts!</p>
                        </div>
                    )}
                    {sortedReviews.map((review: MovieReview) => (
                        <div key={review.id} className={styles.reviewCard}>
                            <div className={styles.reviewHeader}>
                                <div className={styles.avatar}>
                                    <span>{review.userName.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className={styles.userInfo}>
                                    <span className={styles.userName}>{review.userName}</span>
                                    <span className={styles.reviewDate}>{formatDate(review.createdAt)}</span>
                                </div>
                                <div className={styles.reviewRating}>
                                    <Stars rating={review.rating} size="small" />
                                </div>
                            </div>
                            {review.comment && (
                                <p className={styles.reviewContent}>{review.comment}</p>
                            )}
                            {!review.comment && (
                                <p className={styles.reviewNoComment}>Rated {review.rating} out of 5 stars</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
