import { getApiBaseUrl, setDiagnosticsError } from './env';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';

interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
}

class ApiClient {
    private async getBaseUrl(): Promise<string> {
        return getApiBaseUrl();
    }

    private async refreshAccessToken(): Promise<boolean> {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) return false;

        try {
            const baseUrl = await this.getBaseUrl();
            const res = await fetch(`${baseUrl}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!res.ok) {
                await clearTokens();
                return false;
            }

            const data = await res.json();
            await setTokens(data.data.accessToken, data.data.refreshToken);
            return true;
        } catch {
            await clearTokens();
            return false;
        }
    }

    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const baseUrl = await this.getBaseUrl();
        const url = `${baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        const accessToken = await getAccessToken();
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        let res: Response;
        try {
            res = await fetch(url, { ...options, headers });
        } catch (err) {
            const errorInfo = {
                code: 'NETWORK_ERROR',
                message: err instanceof Error ? err.message : 'Network request failed',
            };
            setDiagnosticsError(errorInfo);
            throw new Error(errorInfo.message);
        }

        // Handle 401 - try refresh
        if (res.status === 401) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                const newToken = await getAccessToken();
                headers['Authorization'] = `Bearer ${newToken}`;
                res = await fetch(url, { ...options, headers });
            }
        }

        // Parse response
        let data: unknown;
        try {
            data = await res.json();
        } catch {
            data = {};
        }

        if (!res.ok) {
            const errorData = data as { error?: ApiError };
            const errorInfo = {
                status: res.status,
                code: errorData.error?.code || 'API_ERROR',
                message: errorData.error?.message || `Request failed: ${res.status}`,
                requestId: errorData.error?.requestId,
            };
            setDiagnosticsError(errorInfo);
            throw new Error(errorInfo.message);
        }

        return data as T;
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, body?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async put<T>(endpoint: string, body?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async patch<T>(endpoint: string, body?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    // Health check utility
    async pingHealth(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
        const start = Date.now();
        try {
            const baseUrl = await this.getBaseUrl();
            const res = await fetch(`${baseUrl}/health`);
            const latencyMs = Date.now() - start;

            if (res.ok) {
                return { ok: true, message: 'API is healthy', latencyMs };
            }
            return { ok: false, message: `Status: ${res.status}`, latencyMs };
        } catch (err) {
            const latencyMs = Date.now() - start;
            return { ok: false, message: err instanceof Error ? err.message : 'Failed', latencyMs };
        }
    }
}

export const api = new ApiClient();
export type { ApiError };
