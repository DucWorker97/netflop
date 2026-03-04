import * as SecureStore from 'expo-secure-store';
import { setDiagnosticsTokenPresent } from './env';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export async function getAccessToken(): Promise<string | null> {
    try {
        const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        setDiagnosticsTokenPresent(!!token);
        return token;
    } catch {
        setDiagnosticsTokenPresent(false);
        return null;
    }
}

export async function getRefreshToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
        return null;
    }
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
        setDiagnosticsTokenPresent(true);
    } catch (err) {
        console.warn('Failed to save tokens to SecureStore:', err);
        // Fallback: tokens won't persist across app restarts
        setDiagnosticsTokenPresent(false);
    }
}

export async function clearTokens(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
        // Ignore
    }
    setDiagnosticsTokenPresent(false);
}

export async function isAuthenticated(): Promise<boolean> {
    const token = await getAccessToken();
    return !!token;
}
