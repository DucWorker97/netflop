'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './TrailerPreview.module.css';

interface TrailerPreviewProps {
    movieId: string;
    posterUrl: string;
    trailerUrl?: string;
    title: string;
    onPlay?: () => void;
}

export function TrailerPreview({ movieId, posterUrl, trailerUrl, title, onPlay }: TrailerPreviewProps) {
    const [isHovering, setIsHovering] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isHovering && trailerUrl) {
            // Delay before starting to play
            hoverTimeoutRef.current = setTimeout(() => {
                setIsPlaying(true);
                videoRef.current?.play();
            }, 500);
        } else {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
            setIsPlaying(false);
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }

        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, [isHovering, trailerUrl]);

    return (
        <div
            className={styles.container}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Poster Image */}
            <img
                src={posterUrl || '/placeholder-poster.jpg'}
                alt={title}
                className={`${styles.poster} ${isPlaying ? styles.posterHidden : ''}`}
            />

            {/* Trailer Video */}
            {trailerUrl && (
                <video
                    ref={videoRef}
                    className={`${styles.video} ${isPlaying ? styles.videoVisible : ''}`}
                    src={trailerUrl}
                    muted={isMuted}
                    loop
                    playsInline
                />
            )}

            {/* Overlay Controls */}
            <div className={`${styles.overlay} ${isHovering ? styles.overlayVisible : ''}`}>
                <h3 className={styles.title}>{title}</h3>

                <div className={styles.controls}>
                    <button className={styles.playBtn} onClick={onPlay}>
                        ▶ Play
                    </button>

                    {trailerUrl && isPlaying && (
                        <button
                            className={styles.muteBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMuted(!isMuted);
                            }}
                        >
                            {isMuted ? '🔇' : '🔊'}
                        </button>
                    )}
                </div>
            </div>

            {/* Loading indicator while waiting */}
            {isHovering && !isPlaying && trailerUrl && (
                <div className={styles.loadingIndicator}>
                    <div className={styles.spinner} />
                </div>
            )}
        </div>
    );
}
