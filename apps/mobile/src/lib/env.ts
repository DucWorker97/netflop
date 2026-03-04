import * as SecureStore from 'expo-secure-store';

// ─────────────────────────────────────────────────────────────
// API Base URL Configuration
// ─────────────────────────────────────────────────────────────

const CUSTOM_BASE_URL_KEY = 'customApiBaseUrl';

// Default from env or fallback
const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// S3 Base URL for media (HLS streams, posters, etc.)
const DEFAULT_S3_BASE_URL = process.env.EXPO_PUBLIC_S3_PUBLIC_BASE_URL || 'http://localhost:9000/netflop-media';

// ─────────────────────────────────────────────────────────────
// Startup Diagnostics - Log actual env values
// ─────────────────────────────────────────────────────────────
console.log('[env] ══════════════════════════════════════════════');
console.log('[env] EXPO_PUBLIC_API_BASE_URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
console.log('[env] EXPO_PUBLIC_S3_PUBLIC_BASE_URL:', process.env.EXPO_PUBLIC_S3_PUBLIC_BASE_URL);
console.log('[env] DEFAULT_API_BASE_URL:', DEFAULT_API_BASE_URL);
console.log('[env] DEFAULT_S3_BASE_URL:', DEFAULT_S3_BASE_URL);
console.log('[env] ══════════════════════════════════════════════');

// Export S3 base URL getter (synchronous, read from env)
export function getS3BaseUrl(): string {
    return DEFAULT_S3_BASE_URL;
}

// Presets for easy switching
export const API_PRESETS = {
    simulator: 'http://localhost:3000',
    androidEmulator: 'http://10.0.2.2:3000',
    custom: '', // User will input LAN IP
} as const;

export type ApiPreset = keyof typeof API_PRESETS;

let cachedBaseUrl: string | null = null;

export async function getApiBaseUrl(): Promise<string> {
    if (cachedBaseUrl) {
        return cachedBaseUrl;
    }

    try {
        const customUrl = await SecureStore.getItemAsync(CUSTOM_BASE_URL_KEY);
        if (customUrl) {
            cachedBaseUrl = customUrl;
            return customUrl;
        }
    } catch {
        // Ignore secure store errors
    }

    cachedBaseUrl = DEFAULT_API_BASE_URL;
    return DEFAULT_API_BASE_URL;
}

export async function setApiBaseUrl(url: string): Promise<void> {
    cachedBaseUrl = url;
    try {
        await SecureStore.setItemAsync(CUSTOM_BASE_URL_KEY, url);
    } catch {
        // Fallback: just use in-memory cache
    }
}

export async function clearApiBaseUrl(): Promise<void> {
    cachedBaseUrl = null;
    try {
        await SecureStore.deleteItemAsync(CUSTOM_BASE_URL_KEY);
    } catch {
        // Ignore
    }
}

export function getApiBaseUrlSync(): string {
    return cachedBaseUrl || DEFAULT_API_BASE_URL;
}

// ─────────────────────────────────────────────────────────────
// Diagnostics State (for debugging)
// ─────────────────────────────────────────────────────────────

interface DiagnosticsState {
    lastError: {
        status?: number;
        code?: string;
        message?: string;
        requestId?: string;
        timestamp?: string;
    } | null;
    lastPlaybackUrl: string | null;
    tokenPresent: boolean;
}

let diagnostics: DiagnosticsState = {
    lastError: null,
    lastPlaybackUrl: null,
    tokenPresent: false,
};

export function setDiagnosticsError(error: DiagnosticsState['lastError']) {
    diagnostics.lastError = { ...error, timestamp: new Date().toISOString() };
}

export function setDiagnosticsPlaybackUrl(url: string) {
    diagnostics.lastPlaybackUrl = url;
}

export function setDiagnosticsTokenPresent(present: boolean) {
    diagnostics.tokenPresent = present;
}

export function getDiagnostics(): DiagnosticsState {
    return { ...diagnostics };
}
