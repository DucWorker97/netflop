'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';

interface User {
    id: string;
    email: string;
    role: string;
}

interface ForgotPasswordResult {
    message: string;
    resetToken?: string;
    resetUrl?: string;
    expiresAt?: string;
}

interface PasswordActionResult {
    message: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string, redirectTo?: string) => Promise<void>;
    register: (email: string, password: string, redirectTo?: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<ForgotPasswordResult>;
    resetPassword: (token: string, newPassword: string) => Promise<PasswordActionResult>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            if (api.isAuthenticated()) {
                try {
                    const res = await api.get<{ data: User }>('/api/auth/me');
                    setUser(res.data);
                } catch {
                    api.clearTokens();
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string, redirectTo = '/') => {
        interface LoginResponse {
            data: {
                accessToken: string;
                refreshToken: string;
                user: User;
            };
        }

        const res = await api.post<LoginResponse>('/api/auth/login', { email, password });
        api.setTokens(res.data.accessToken, res.data.refreshToken);
        setUser(res.data.user);
        router.push(redirectTo);
    };

    const register = async (email: string, password: string, redirectTo = '/') => {
        interface RegisterResponse {
            data: {
                accessToken: string;
                refreshToken: string;
                user: User;
            };
        }

        const res = await api.post<RegisterResponse>('/api/auth/register', { email, password });
        api.setTokens(res.data.accessToken, res.data.refreshToken);
        setUser(res.data.user);
        router.push(redirectTo);
    };

    const forgotPassword = async (email: string) => {
        const res = await api.post<{ data: ForgotPasswordResult }>('/api/auth/forgot-password', { email });
        return res.data;
    };

    const resetPassword = async (token: string, newPassword: string) => {
        const res = await api.post<{ data: PasswordActionResult }>('/api/auth/reset-password', {
            token,
            newPassword,
        });
        return res.data;
    };

    const logout = () => {
        api.clearTokens();
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                forgotPassword,
                resetPassword,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
