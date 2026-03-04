'use client';

import { useState } from 'react';
import styles from './QualitySelector.module.css';

export type QualityValue = string | number;

export interface QualityOption {
    label: string;
    value: QualityValue;
    hint?: string;
}

interface QualitySelectorProps {
    options: QualityOption[];
    selected: QualityValue;
    onChange: (value: QualityValue) => void;
    disabled?: boolean;
}

export function QualitySelector({ options, selected, onChange, disabled }: QualitySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const activeOption = options.find(option => option.value === selected) ?? options[0];
    const isDisabled = disabled || options.length === 0;

    return (
        <div className={styles.container}>
            <button
                className={styles.trigger}
                onClick={() => setIsOpen((prev) => !prev)}
                disabled={isDisabled}
            >
                <span className={styles.icon}>HD</span>
                <span className={styles.label}>{activeOption?.label || 'Auto'}</span>
            </button>

            {isOpen && !isDisabled && (
                <>
                    <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
                    <div className={styles.dropdown}>
                        <div className={styles.header}>Quality</div>
                        <div className={styles.options}>
                            {options.map((option) => (
                                <button
                                    key={String(option.value)}
                                    className={`${styles.option} ${option.value === selected ? styles.optionActive : ''}`}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className={styles.optionLabel}>{option.label}</span>
                                    {option.hint && <span className={styles.optionHint}>{option.hint}</span>}
                                    {option.value === selected && <span className={styles.checkmark}>âœ“</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
