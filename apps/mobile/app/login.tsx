import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForgotPassword, useLogin, useResetPassword } from '../src/hooks/queries';
import { PASSWORD_REQUIREMENTS_HINT, getPasswordValidationError } from '../src/lib/security';

type AuthMode = 'login' | 'forgot' | 'reset';

interface ResetDebugInfo {
    resetToken?: string;
    resetUrl?: string;
}

export default function LoginScreen() {
    const router = useRouter();
    const loginMutation = useLogin();
    const forgotPasswordMutation = useForgotPassword();
    const resetPasswordMutation = useResetPassword();

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resetDebugInfo, setResetDebugInfo] = useState<ResetDebugInfo | null>(null);

    const isSubmitting =
        loginMutation.isPending || forgotPasswordMutation.isPending || resetPasswordMutation.isPending;

    const switchMode = (nextMode: AuthMode) => {
        setMode(nextMode);
        setError('');
        setSuccess('');
        setResetDebugInfo(null);
        if (nextMode !== 'reset') {
            setResetToken('');
            setPassword('');
            setConfirmPassword('');
        }
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');
        setResetDebugInfo(null);

        if (mode === 'login') {
            if (!email.trim() || !password) {
                setError('Please enter email and password');
                return;
            }

            try {
                await loginMutation.mutateAsync({ email: email.trim(), password });
                router.replace('/(tabs)');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Login failed');
            }

            return;
        }

        if (mode === 'forgot') {
            if (!email.trim()) {
                setError('Email is required');
                return;
            }

            try {
                const result = await forgotPasswordMutation.mutateAsync({ email: email.trim() });
                setSuccess(result.message);
                setResetDebugInfo(result);
                if (result.resetToken) {
                    setResetToken(result.resetToken);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to generate reset instructions');
            }

            return;
        }

        if (!resetToken.trim()) {
            setError('Reset token is required');
            return;
        }

        const passwordError = getPasswordValidationError(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const result = await resetPasswordMutation.mutateAsync({
                token: resetToken.trim(),
                newPassword: password,
            });
            setSuccess(`${result.message}. You can sign in now.`);
            setPassword('');
            setConfirmPassword('');
            setResetToken('');
            setMode('login');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>netflop</Text>
                <Text style={styles.subtitle}>
                    {mode === 'login'
                        ? 'Sign in to continue'
                        : mode === 'forgot'
                            ? 'Generate reset instructions'
                            : 'Set a new password'}
                </Text>

                <View style={styles.modeRow}>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}
                        onPress={() => switchMode('login')}
                    >
                        <Text style={[styles.modeButtonText, mode === 'login' && styles.modeButtonTextActive]}>
                            Sign In
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'forgot' && styles.modeButtonActive]}
                        onPress={() => switchMode('forgot')}
                    >
                        <Text style={[styles.modeButtonText, mode === 'forgot' && styles.modeButtonTextActive]}>
                            Forgot
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'reset' && styles.modeButtonActive]}
                        onPress={() => switchMode('reset')}
                    >
                        <Text style={[styles.modeButtonText, mode === 'reset' && styles.modeButtonTextActive]}>
                            Reset
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    {mode !== 'reset' && (
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    )}

                    {mode === 'reset' && (
                        <TextInput
                            style={styles.input}
                            placeholder="Reset token"
                            placeholderTextColor="#666"
                            value={resetToken}
                            onChangeText={setResetToken}
                            autoCapitalize="none"
                        />
                    )}

                    {(mode === 'login' || mode === 'reset') && (
                        <TextInput
                            style={styles.input}
                            placeholder={mode === 'reset' ? 'New password' : 'Password'}
                            placeholderTextColor="#666"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    )}

                    {mode === 'reset' && (
                        <>
                            <Text style={styles.helperText}>{PASSWORD_REQUIREMENTS_HINT}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm password"
                                placeholderTextColor="#666"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </>
                    )}

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {success ? (
                        <View style={styles.statusBox}>
                            <Text style={styles.statusText}>{success}</Text>
                            {resetDebugInfo?.resetUrl ? (
                                <Text style={styles.debugText}>{resetDebugInfo.resetUrl}</Text>
                            ) : null}
                            {resetDebugInfo?.resetToken ? (
                                <>
                                    <Text style={styles.debugText}>{resetDebugInfo.resetToken}</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setResetToken(resetDebugInfo.resetToken || '');
                                            setMode('reset');
                                        }}
                                    >
                                        <Text style={styles.linkText}>Continue with reset token</Text>
                                    </TouchableOpacity>
                                </>
                            ) : null}
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.button, isSubmitting && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {mode === 'login'
                                    ? 'Sign In'
                                    : mode === 'forgot'
                                        ? 'Send reset instructions'
                                        : 'Reset password'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {mode === 'login' ? (
                    <Text style={styles.hint}>Demo: viewer@netflop.local / viewer123</Text>
                ) : (
                    <TouchableOpacity onPress={() => switchMode('login')}>
                        <Text style={styles.linkText}>Back to sign in</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#3b82f6',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginBottom: 28,
    },
    modeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    modeButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#2f2f2f',
        borderRadius: 999,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#151515',
    },
    modeButtonActive: {
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
    },
    modeButtonText: {
        color: '#888',
        fontWeight: '600',
    },
    modeButtonTextActive: {
        color: '#3b82f6',
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        color: '#fff',
    },
    helperText: {
        color: '#777',
        fontSize: 13,
        marginTop: -6,
    },
    error: {
        color: '#60a5fa',
        fontSize: 14,
        textAlign: 'center',
    },
    statusBox: {
        gap: 10,
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.35)',
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
    },
    statusText: {
        color: '#d1fae5',
        fontSize: 14,
    },
    debugText: {
        color: '#cbd5e1',
        fontSize: 12,
    },
    button: {
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    linkText: {
        color: '#60a5fa',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 18,
    },
    hint: {
        color: '#555',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 24,
    },
});
