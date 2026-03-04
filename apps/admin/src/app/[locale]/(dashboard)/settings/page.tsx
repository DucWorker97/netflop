'use client';

import { useState } from 'react';
import styles from './settings.module.css';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        // Site Info
        siteName: 'Netflop',
        siteDescription: 'Your favorite movie streaming platform',
        supportEmail: 'support@netflop.com',

        // Features
        enableRatings: true,
        enableDownloads: true,
        enableProfiles: true,
        maintenanceMode: false,

        // Content
        defaultQuality: '720p',
        maxUploadSize: 5, // GB
        encodeQualities: ['360p', '480p', '720p'],

        // Security
        requireEmailVerification: false,
        sessionTimeout: 7, // days
        maxLoginAttempts: 5,
    });

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        // Save to API
        alert('Settings saved!');
    };

    return (
        <div>
            <div className={styles.header}>
                <h1>⚙️ Settings</h1>
                <button className="btn btn-primary" onClick={handleSave}>
                    Save Changes
                </button>
            </div>

            {/* Site Info */}
            <div className={styles.section}>
                <h2>🌐 Site Information</h2>

                <div className={styles.formGroup}>
                    <label>Site Name</label>
                    <input
                        type="text"
                        className="input"
                        value={settings.siteName}
                        onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Site Description</label>
                    <textarea
                        className={styles.textarea}
                        value={settings.siteDescription}
                        onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                        rows={3}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Support Email</label>
                    <input
                        type="email"
                        className="input"
                        value={settings.supportEmail}
                        onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                    />
                </div>
            </div>

            {/* Features */}
            <div className={styles.section}>
                <h2>🎛️ Feature Toggles</h2>

                <div className={styles.toggle}>
                    <div>
                        <span className={styles.toggleLabel}>Enable Ratings</span>
                        <p className={styles.toggleDesc}>Allow users to rate movies</p>
                    </div>
                    <button
                        className={`${styles.toggleSwitch} ${settings.enableRatings ? styles.toggleOn : ''}`}
                        onClick={() => handleToggle('enableRatings')}
                    >
                        <span className={styles.toggleKnob} />
                    </button>
                </div>

                <div className={styles.toggle}>
                    <div>
                        <span className={styles.toggleLabel}>Enable Downloads</span>
                        <p className={styles.toggleDesc}>Allow offline downloads on mobile</p>
                    </div>
                    <button
                        className={`${styles.toggleSwitch} ${settings.enableDownloads ? styles.toggleOn : ''}`}
                        onClick={() => handleToggle('enableDownloads')}
                    >
                        <span className={styles.toggleKnob} />
                    </button>
                </div>

                <div className={styles.toggle}>
                    <div>
                        <span className={styles.toggleLabel}>Enable Multiple Profiles</span>
                        <p className={styles.toggleDesc}>Allow users to create multiple profiles</p>
                    </div>
                    <button
                        className={`${styles.toggleSwitch} ${settings.enableProfiles ? styles.toggleOn : ''}`}
                        onClick={() => handleToggle('enableProfiles')}
                    >
                        <span className={styles.toggleKnob} />
                    </button>
                </div>

                <div className={`${styles.toggle} ${styles.dangerToggle}`}>
                    <div>
                        <span className={styles.toggleLabel}>Maintenance Mode</span>
                        <p className={styles.toggleDesc}>Show maintenance page to all users</p>
                    </div>
                    <button
                        className={`${styles.toggleSwitch} ${settings.maintenanceMode ? styles.toggleDanger : ''}`}
                        onClick={() => handleToggle('maintenanceMode')}
                    >
                        <span className={styles.toggleKnob} />
                    </button>
                </div>
            </div>

            {/* Content Settings */}
            <div className={styles.section}>
                <h2>📹 Content Settings</h2>

                <div className={styles.formGroup}>
                    <label>Default Playback Quality</label>
                    <select
                        className="input"
                        value={settings.defaultQuality}
                        onChange={(e) => setSettings(prev => ({ ...prev, defaultQuality: e.target.value }))}
                    >
                        <option value="360p">360p (Low)</option>
                        <option value="480p">480p (Medium)</option>
                        <option value="720p">720p (HD)</option>
                        <option value="1080p">1080p (Full HD)</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Max Upload Size (GB)</label>
                    <input
                        type="number"
                        className="input"
                        value={settings.maxUploadSize}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxUploadSize: parseInt(e.target.value) || 0 }))}
                        min={1}
                        max={20}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Encode Qualities</label>
                    <div className={styles.checkboxGroup}>
                        {['360p', '480p', '720p', '1080p'].map(quality => (
                            <label key={quality} className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={settings.encodeQualities.includes(quality)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSettings(prev => ({
                                                ...prev,
                                                encodeQualities: [...prev.encodeQualities, quality]
                                            }));
                                        } else {
                                            setSettings(prev => ({
                                                ...prev,
                                                encodeQualities: prev.encodeQualities.filter(q => q !== quality)
                                            }));
                                        }
                                    }}
                                />
                                {quality}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className={styles.section}>
                <h2>🔒 Security</h2>

                <div className={styles.toggle}>
                    <div>
                        <span className={styles.toggleLabel}>Require Email Verification</span>
                        <p className={styles.toggleDesc}>Users must verify email before access</p>
                    </div>
                    <button
                        className={`${styles.toggleSwitch} ${settings.requireEmailVerification ? styles.toggleOn : ''}`}
                        onClick={() => handleToggle('requireEmailVerification')}
                    >
                        <span className={styles.toggleKnob} />
                    </button>
                </div>

                <div className={styles.formGroup}>
                    <label>Session Timeout (days)</label>
                    <input
                        type="number"
                        className="input"
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 1 }))}
                        min={1}
                        max={30}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Max Login Attempts</label>
                    <input
                        type="number"
                        className="input"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 1 }))}
                        min={1}
                        max={10}
                    />
                </div>
            </div>
        </div>
    );
}
