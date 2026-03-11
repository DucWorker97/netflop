'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PASSWORD_REQUIREMENTS_HINT, getPasswordValidationError } from '@/lib/security';
import styles from './login.module.css';

type AuthMode = 'login' | 'forgot' | 'reset';

interface ResetDebugInfo {
    resetToken?: string;
    resetUrl?: string;
    expiresAt?: string;
}

function getMode(modeParam: string | null, tokenParam: string | null): AuthMode {
    if (tokenParam || modeParam === 'reset') return 'reset';
    if (modeParam === 'forgot') return 'forgot';
    return 'login';
}

export default function LoginPage() {
    const { login, forgotPassword, resetPassword, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentMode = getMode(searchParams.get('mode'), searchParams.get('token'));
    const tokenFromUrl = searchParams.get('token') || '';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetToken, setResetToken] = useState(tokenFromUrl);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resetDebugInfo, setResetDebugInfo] = useState<ResetDebugInfo | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (tokenFromUrl) {
            setResetToken(tokenFromUrl);
        }
    }, [tokenFromUrl]);

    const content = useMemo(() => {
        switch (currentMode) {
            case 'forgot':
                return {
                    title: 'Password recovery',
                    subtitle: 'Generate a reset link for your admin account.',
                    submitLabel: isSubmitting ? 'Generating...' : 'Send reset instructions',
                };
            case 'reset':
                return {
                    title: 'Set a new password',
                    subtitle: 'Use the one-time token to finish the reset.',
                    submitLabel: isSubmitting ? 'Resetting...' : 'Reset password',
                };
            default:
                return {
                    title: 'netflop',
                    subtitle: 'Admin Dashboard',
                    submitLabel: isSubmitting ? 'Signing in...' : 'Sign In',
                };
        }
    }, [currentMode, isSubmitting]);

    const updateMode = (nextMode: AuthMode, nextToken?: string, preserveFeedback = false) => {
        const params = new URLSearchParams(searchParams.toString());

        if (nextMode === 'login') {
            params.delete('mode');
            params.delete('token');
        } else if (nextMode === 'forgot') {
            params.set('mode', 'forgot');
            params.delete('token');
        } else {
            params.set('mode', 'reset');
            if (nextToken) {
                params.set('token', nextToken);
            } else {
                params.delete('token');
            }
        }

        setError('');
        if (!preserveFeedback) {
            setSuccess('');
            setResetDebugInfo(null);
        }

        if (nextMode !== 'reset') {
            setResetToken('');
        } else if (nextToken) {
            setResetToken(nextToken);
        }

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setResetDebugInfo(null);

        if (currentMode === 'forgot') {
            if (!email.trim()) {
                setError('Email is required');
                return;
            }
        }

        if (currentMode === 'reset') {
            const passwordError = getPasswordValidationError(password);
            if (passwordError) {
                setError(passwordError);
                return;
            }

            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }

            if (!resetToken.trim()) {
                setError('Reset token is required');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            if (currentMode === 'login') {
                await login(email.trim(), password);
                return;
            }

            if (currentMode === 'forgot') {
                const result = await forgotPassword(email.trim());
                setSuccess(result.message);
                setResetDebugInfo(result);
                return;
            }

            const result = await resetPassword(resetToken.trim(), password);
            setSuccess(`${result.message}. You can sign in now.`);
            setPassword('');
            setConfirmPassword('');
            setResetToken('');
            updateMode('login', undefined, true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Request failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className="skeleton" style={{ height: 200 }} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>{content.title}</h1>
                <p className={styles.subtitle}>{content.subtitle}</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {currentMode !== 'reset' && (
                        <div className={styles.field}>
                            <label className="label" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@netflop.local"
                                required
                            />
                        </div>
                    )}

                    {currentMode === 'reset' && (
                        <div className={styles.field}>
                            <label className="label" htmlFor="resetToken">Reset token</label>
                            <input
                                id="resetToken"
                                type="text"
                                className="input"
                                value={resetToken}
                                onChange={(e) => setResetToken(e.target.value)}
                                placeholder="Paste your reset token"
                                required
                            />
                        </div>
                    )}

                    {(currentMode === 'login' || currentMode === 'reset') && (
                        <div className={styles.field}>
                            <label className="label" htmlFor="password">
                                {currentMode === 'reset' ? 'New Password' : 'Password'}
                            </label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    minLength={currentMode === 'login' ? undefined : 8}
                                />
                                <button
                                    type="button"
                                    className={styles.showPasswordBtn}
                                    onClick={() => setShowPassword((value) => !value)}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentMode === 'reset' && (
                        <>
                            <p className={styles.helperText}>{PASSWORD_REQUIREMENTS_HINT}</p>
                            <div className={styles.field}>
                                <label className="label" htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Enter your password again"
                                    required
                                    minLength={8}
                                />
                            </div>
                        </>
                    )}

                    {error && <p className="error-text">{error}</p>}

                    {success && (
                        <div className={styles.statusBox}>
                            <p>{success}</p>
                            {resetDebugInfo?.resetUrl && (
                                <a href={resetDebugInfo.resetUrl} className={styles.inlineLink}>
                                    Open reset form
                                </a>
                            )}
                            {!resetDebugInfo?.resetUrl && resetDebugInfo?.resetToken && (
                                <button
                                    type="button"
                                    className={styles.textButton}
                                    onClick={() => updateMode('reset', resetDebugInfo.resetToken)}
                                >
                                    Continue with reset token
                                </button>
                            )}
                            {resetDebugInfo?.resetToken && (
                                <code className={styles.tokenValue}>{resetDebugInfo.resetToken}</code>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={isSubmitting}
                    >
                        {content.submitLabel}
                    </button>
                </form>

                <div className={styles.footerActions}>
                    {currentMode === 'login' && (
                        <button
                            type="button"
                            className={styles.textButton}
                            onClick={() => updateMode('forgot')}
                        >
                            Forgot password?
                        </button>
                    )}

                    {(currentMode === 'forgot' || currentMode === 'reset') && (
                        <button
                            type="button"
                            className={styles.textButton}
                            onClick={() => updateMode('login')}
                        >
                            Back to sign in
                        </button>
                    )}
                </div>

                {currentMode === 'login' && (
                    <p className={styles.hint}>
                        Demo: admin@netflop.local / admin123
                    </p>
                )}
            </div>
        </div>
    );
}
