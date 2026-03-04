'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
    const { login, register, isLoading } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (mode === 'register' && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(email, password);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : `${mode === 'login' ? 'Login' : 'Registration'} failed`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className="loading-spinner"><div className="spinner" /></div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <Link href="/" className={styles.title}>netflop</Link>
                <p className={styles.subtitle}>
                    {mode === 'login' ? 'Sign in to watch' : 'Create your account'}
                </p>

                {/* Mode Toggle */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('login');
                            setError('');
                        }}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: 'none',
                            border: 'none',
                            color: mode === 'login' ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
                            borderBottom: mode === 'login' ? '2px solid var(--accent)' : '2px solid transparent',
                            cursor: 'pointer',
                            fontWeight: mode === 'login' ? 600 : 400,
                            transition: 'all 0.2s'
                        }}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('register');
                            setError('');
                        }}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: 'none',
                            border: 'none',
                            color: mode === 'register' ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
                            borderBottom: mode === 'register' ? '2px solid var(--accent)' : '2px solid transparent',
                            cursor: 'pointer',
                            fontWeight: mode === 'register' ? 600 : 400,
                            transition: 'all 0.2s'
                        }}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password">Password</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                className={styles.showPasswordBtn}
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {mode === 'register' && (
                        <div className={styles.field}>
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    )}

                    {error && <p className="error-text">{error}</p>}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                            : (mode === 'login' ? 'Sign In' : 'Register')
                        }
                    </button>
                </form>

                {mode === 'login' && (
                    <p className={styles.hint}>
                        Demo: viewer@netflop.local / viewer123
                    </p>
                )}
            </div>
        </div>
    );
}
