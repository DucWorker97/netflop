'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PASSWORD_REQUIREMENTS_HINT, getPasswordValidationError } from '@/lib/security';
import styles from './login.module.css';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

interface ResetDebugInfo {
    resetToken?: string;
    resetUrl?: string;
    expiresAt?: string;
}

function getMode(modeParam: string | null, tokenParam: string | null): AuthMode {
    if (tokenParam || modeParam === 'reset') return 'reset';
    if (modeParam === 'forgot') return 'forgot';
    if (modeParam === 'register') return 'register';
    return 'login';
}

export function LoginPageClient() {
    const { login, register, forgotPassword, resetPassword, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentMode = getMode(searchParams.get('mode'), searchParams.get('token'));
    const redirectTo = searchParams.get('redirect') || '/';
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
            case 'register':
                return {
                    title: 'Create your account',
                    submitLabel: isSubmitting ? 'Creating account...' : 'Register',
                    passwordLabel: 'Password',
                };
            case 'forgot':
                return {
                    title: 'Reset your password',
                    submitLabel: isSubmitting ? 'Sending instructions...' : 'Send reset instructions',
                    passwordLabel: '',
                };
            case 'reset':
                return {
                    title: 'Choose a new password',
                    submitLabel: isSubmitting ? 'Resetting password...' : 'Reset password',
                    passwordLabel: 'New password',
                };
            default:
                return {
                    title: 'Sign in to watch',
                    submitLabel: isSubmitting ? 'Signing in...' : 'Sign In',
                    passwordLabel: 'Password',
                };
        }
    }, [currentMode, isSubmitting]);

    const updateMode = (nextMode: AuthMode, nextToken?: string, preserveFeedback = false) => {
        const params = new URLSearchParams(searchParams.toString());

        if (nextMode === 'login') {
            params.delete('mode');
            params.delete('token');
        } else if (nextMode === 'register') {
            params.set('mode', 'register');
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

        if (currentMode === 'forgot' && !email.trim()) {
            setError('Email is required');
            return;
        }

        if (currentMode === 'register' || currentMode === 'reset') {
            const passwordError = getPasswordValidationError(password);
            if (passwordError) {
                setError(passwordError);
                return;
            }

            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }

        if (currentMode === 'reset' && !resetToken.trim()) {
            setError('Reset token is required');
            return;
        }

        setIsSubmitting(true);

        try {
            if (currentMode === 'login') {
                await login(email.trim(), password, redirectTo);
                return;
            }

            if (currentMode === 'register') {
                await register(email.trim(), password, redirectTo);
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
            setError(
                err instanceof Error
                    ? err.message
                    : `${currentMode === 'login' ? 'Login' : 'Request'} failed`
            );
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
                <p className={styles.subtitle}>{content.title}</p>

                {(currentMode === 'login' || currentMode === 'register') && (
                    <div className={styles.modeTabs}>
                        <button
                            type="button"
                            className={`${styles.modeTab} ${currentMode === 'login' ? styles.modeTabActive : ''}`}
                            onClick={() => updateMode('login')}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className={`${styles.modeTab} ${currentMode === 'register' ? styles.modeTabActive : ''}`}
                            onClick={() => updateMode('register')}
                        >
                            Register
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    {currentMode !== 'reset' && (
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
                    )}

                    {currentMode === 'reset' && (
                        <div className={styles.field}>
                            <label htmlFor="resetToken">Reset token</label>
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

                    {(currentMode === 'login' || currentMode === 'register' || currentMode === 'reset') && (
                        <div className={styles.field}>
                            <label htmlFor="password">{content.passwordLabel}</label>
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

                    {(currentMode === 'register' || currentMode === 'reset') && (
                        <>
                            <p className={styles.helperText}>{PASSWORD_REQUIREMENTS_HINT}</p>
                            <div className={styles.field}>
                                <label htmlFor="confirmPassword">Confirm password</label>
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

                    {currentMode === 'register' && (
                        <button
                            type="button"
                            className={styles.textButton}
                            onClick={() => updateMode('login')}
                        >
                            Back to sign in
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
                        Demo: viewer@netflop.local / viewer123
                    </p>
                )}
            </div>
        </div>
    );
}
