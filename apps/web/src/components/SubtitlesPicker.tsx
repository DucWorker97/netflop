'use client';

import { useState } from 'react';
import styles from './SubtitlesPicker.module.css';

interface Subtitle {
    id: string;
    language: string;
    label: string;
    url: string;
}

interface SubtitlesPickerProps {
    subtitles: Subtitle[];
    currentSubtitle: string | null;
    onSelect: (id: string | null) => void;
    isOpen: boolean;
    onClose: () => void;
}

const COMMON_LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'th', label: 'ไทย', flag: '🇹🇭' },
];

export function SubtitlesPicker({ subtitles, currentSubtitle, onSelect, isOpen, onClose }: SubtitlesPickerProps) {
    const [showSettings, setShowSettings] = useState(false);
    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
    const [bgStyle, setBgStyle] = useState<'transparent' | 'semi' | 'solid'>('semi');

    if (!isOpen) return null;

    const getLanguageInfo = (code: string) => {
        return COMMON_LANGUAGES.find(l => code.startsWith(l.code)) || { code, label: code, flag: '🌐' };
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.picker} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Subtitles</h3>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={!showSettings ? styles.tabActive : ''}
                        onClick={() => setShowSettings(false)}
                    >
                        Language
                    </button>
                    <button
                        className={showSettings ? styles.tabActive : ''}
                        onClick={() => setShowSettings(true)}
                    >
                        Settings
                    </button>
                </div>

                {!showSettings ? (
                    <div className={styles.languages}>
                        {/* Off option */}
                        <button
                            className={`${styles.langOption} ${!currentSubtitle ? styles.selected : ''}`}
                            onClick={() => onSelect(null)}
                        >
                            <span className={styles.flag}>🚫</span>
                            <span>Off</span>
                            {!currentSubtitle && <span className={styles.checkmark}>✓</span>}
                        </button>

                        {/* Available subtitles */}
                        {subtitles.map(sub => {
                            const langInfo = getLanguageInfo(sub.language);
                            return (
                                <button
                                    key={sub.id}
                                    className={`${styles.langOption} ${currentSubtitle === sub.id ? styles.selected : ''}`}
                                    onClick={() => onSelect(sub.id)}
                                >
                                    <span className={styles.flag}>{langInfo.flag}</span>
                                    <span>{sub.label || langInfo.label}</span>
                                    {currentSubtitle === sub.id && <span className={styles.checkmark}>✓</span>}
                                </button>
                            );
                        })}

                        {subtitles.length === 0 && (
                            <div className={styles.empty}>
                                No subtitles available for this movie
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.settings}>
                        <div className={styles.settingGroup}>
                            <label>Font Size</label>
                            <div className={styles.options}>
                                {(['small', 'medium', 'large'] as const).map(size => (
                                    <button
                                        key={size}
                                        className={fontSize === size ? styles.optionActive : ''}
                                        onClick={() => setFontSize(size)}
                                    >
                                        {size.charAt(0).toUpperCase() + size.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.settingGroup}>
                            <label>Background</label>
                            <div className={styles.options}>
                                {(['transparent', 'semi', 'solid'] as const).map(style => (
                                    <button
                                        key={style}
                                        className={bgStyle === style ? styles.optionActive : ''}
                                        onClick={() => setBgStyle(style)}
                                    >
                                        {style.charAt(0).toUpperCase() + style.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.preview}>
                            <p
                                className={styles.previewText}
                                style={{
                                    fontSize: fontSize === 'small' ? '14px' : fontSize === 'large' ? '22px' : '18px',
                                    background: bgStyle === 'transparent' ? 'transparent' :
                                        bgStyle === 'semi' ? 'rgba(0,0,0,0.7)' : '#000',
                                }}
                            >
                                Sample subtitle text
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
