'use client';

import { useState } from 'react';
import styles from './SpeedControls.module.css';

interface SpeedControlsProps {
    currentSpeed: number;
    onSpeedChange: (speed: number) => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function SpeedControls({ currentSpeed, onSpeedChange }: SpeedControlsProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={styles.container}>
            <button
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={styles.icon}>⚡</span>
                <span className={styles.label}>{currentSpeed}x</span>
            </button>

            {isOpen && (
                <>
                    <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
                    <div className={styles.dropdown}>
                        <div className={styles.header}>Playback Speed</div>
                        <div className={styles.options}>
                            {SPEEDS.map(speed => (
                                <button
                                    key={speed}
                                    className={`${styles.option} ${currentSpeed === speed ? styles.optionActive : ''}`}
                                    onClick={() => {
                                        onSpeedChange(speed);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className={styles.speedValue}>{speed}x</span>
                                    {speed === 1 && <span className={styles.speedLabel}>Normal</span>}
                                    {speed < 1 && <span className={styles.speedLabel}>Slow</span>}
                                    {speed > 1 && speed < 2 && <span className={styles.speedLabel}>Fast</span>}
                                    {speed === 2 && <span className={styles.speedLabel}>Max</span>}
                                    {currentSpeed === speed && <span className={styles.checkmark}>✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
