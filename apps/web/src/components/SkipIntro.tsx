'use client';

import { useState, useEffect } from 'react';
import styles from './SkipIntro.module.css';

interface SkipIntroProps {
    currentTime: number;
    introStart?: number;  // When intro starts (default 0)
    introEnd?: number;    // When intro ends (default 90s)
    onSkip: (time: number) => void;
    autoSkip?: boolean;   // Auto-skip when enabled in settings
}

export function SkipIntro({
    currentTime,
    introStart = 0,
    introEnd = 90,
    onSkip,
    autoSkip = false
}: SkipIntroProps) {
    const [visible, setVisible] = useState(false);
    const [countdown, setCountdown] = useState(5);

    // Show button when in intro range
    useEffect(() => {
        const inIntroRange = currentTime >= introStart && currentTime < introEnd - 5;
        setVisible(inIntroRange);
    }, [currentTime, introStart, introEnd]);

    // Auto-skip countdown
    useEffect(() => {
        if (!visible || !autoSkip) {
            setCountdown(5);
            return;
        }

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    onSkip(introEnd);
                    return 5;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [visible, autoSkip, introEnd, onSkip]);

    if (!visible) return null;

    return (
        <button
            className={styles.skipButton}
            onClick={() => onSkip(introEnd)}
        >
            <span className={styles.icon}>⏭️</span>
            <span className={styles.text}>
                Skip Intro
                {autoSkip && <span className={styles.countdown}> ({countdown})</span>}
            </span>
            <div className={styles.progress} style={{ width: `${((introEnd - currentTime) / (introEnd - introStart)) * 100}%` }} />
        </button>
    );
}
