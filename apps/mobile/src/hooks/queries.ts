import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { setTokens, clearTokens } from '../lib/auth';

// Types
export interface Genre {
    id: string;
    name: string;
    slug: string;
}

export interface Movie {
    id: string;
    title: string;
    description: string | null;
    posterUrl: string | null;
    backdropUrl: string | null;
    durationSeconds: number | null;
    releaseYear: number | null;
    movieStatus: 'draft' | 'published';
    encodeStatus: 'pending' | 'processing' | 'ready' | 'failed';
    subtitleUrl: string | null;
    genres: Genre[];
    createdAt: string;
    updatedAt: string;
}

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

interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface HistoryItem {
    id: string;
    movieId: string;
    movie: Movie;
    progressSeconds: number;
    durationSeconds: number;
    completed: boolean;
    updatedAt: string;
}

interface FavoriteItem {
    id: string;
    movieId: string;
    movie: Movie;
    createdAt: string;
}

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'ALERT' | 'NEW_MOVIE';
    movieId: string | null;
    isRead: boolean;
    createdAt: string;
}

export interface SimilarMovie {
    id: string;
    movie_id?: string;
    title: string;
    posterUrl: string | null;
    releaseYear?: number | null;
    score?: number | null;
    reason?: string | null;
    genres?: Genre[];
}

export interface RecommendationMovie {
    id: string;
    movie_id: string;
    title: string;
    posterUrl: string | null;
    releaseYear?: number | null;
    score?: number | null;
    reason?: string | null;
    genres?: Genre[];
}

export interface RecommendationsResponse {
    user_id: string;
    recommendations: RecommendationMovie[];
    algorithm?: string;
}

// Auth
export function useLogin() {
    return useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            const res = await api.post<{
                data: { accessToken: string; refreshToken: string; user: User };
            }>('/api/auth/login', { email, password });
            await setTokens(res.data.accessToken, res.data.refreshToken);
            return res.data.user;
        },
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await clearTokens();
            queryClient.clear();
        },
    });
}

// Genres
export function useGenres() {
    return useQuery({
        queryKey: ['genres'],
        queryFn: async () => {
            const res = await api.get<{ data: Genre[] }>('/api/genres');
            return res.data;
        },
    });
}

// Movies
export function useMovies(params: { page?: number; limit?: number; genreId?: string; q?: string } = {}) {
    const { page = 1, limit = 20, genreId, q } = params;
    const queryParams = new URLSearchParams();
    queryParams.set('page', String(page));
    queryParams.set('limit', String(limit));
    if (genreId) queryParams.set('genreId', genreId);
    if (q) queryParams.set('q', q);

    return useQuery({
        queryKey: ['movies', params],
        queryFn: async () => {
            const res = await api.get<{ data: Movie[]; meta: PaginationMeta }>(
                `/api/movies?${queryParams.toString()}`
            );
            return res;
        },
    });
}

export function useMovie(id: string) {
    return useQuery({
        queryKey: ['movie', id],
        queryFn: async () => {
            const res = await api.get<{ data: Movie }>(`/api/movies/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
}

export function useStreamUrl(id: string) {
    return useQuery({
        queryKey: ['stream', id],
        queryFn: async () => {
            const res = await api.get<{
                data: {
                    playbackUrl: string;
                    qualityOptions?: { name: string; url: string }[];
                    expiresAt: string | null;
                }
            }>(
                `/api/movies/${id}/stream`
            );
            return res.data;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useMovieProgress(id: string) {
    return useQuery({
        queryKey: ['progress', id],
        queryFn: async () => {
            const res = await api.get<{
                data: { progressSeconds: number; durationSeconds: number; completed: boolean };
            }>(`/api/movies/${id}/progress`);
            return res.data;
        },
        enabled: !!id,
    });
}

export function useSimilarMovies(movieId: string) {
    return useQuery({
        queryKey: ['movies', movieId, 'similar'],
        queryFn: async () => {
            const res = await api.get<{ movie_id: string; similar_movies: SimilarMovie[] }>(
                `/api/ai/movies/${movieId}/similar`
            );
            return res.similar_movies;
        },
        enabled: !!movieId,
    });
}

// History
export function useContinueWatching() {
    return useQuery({
        queryKey: ['history', 'continue'],
        queryFn: async () => {
            const res = await api.get<{ data: HistoryItem[] }>('/api/history?continueWatching=true');
            return res.data;
        },
    });
}

export function useForgotPassword() {
    return useMutation({
        mutationFn: async ({ email }: { email: string }) => {
            const res = await api.post<{ data: ForgotPasswordResult }>('/api/auth/forgot-password', { email });
            return res.data;
        },
    });
}

export function useResetPassword() {
    return useMutation({
        mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
            const res = await api.post<{ data: PasswordActionResult }>('/api/auth/reset-password', {
                token,
                newPassword,
            });
            return res.data;
        },
    });
}

export function useWatchHistory() {
    return useQuery({
        queryKey: ['history'],
        queryFn: async () => {
            const res = await api.get<{ data: HistoryItem[] }>('/api/history');
            return res.data;
        },
    });
}

export function useUpdateProgress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            movieId,
            progressSeconds,
            durationSeconds,
        }: {
            movieId: string;
            progressSeconds: number;
            durationSeconds: number;
        }) => {
            await api.post(`/api/history/${movieId}`, { progressSeconds, durationSeconds });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['progress', variables.movieId] });
            queryClient.invalidateQueries({ queryKey: ['history'] });
        },
    });
}

// Notifications
export function useNotifications() {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: async () => api.get<NotificationItem[]>('/api/notifications'),
    });
}

export function useMarkNotificationsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (notificationIds: string[]) => {
            return Promise.all(
                notificationIds.map((notificationId) =>
                    api.patch<NotificationItem>(`/api/notifications/${notificationId}/read`)
                )
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

// Favorites
export function useFavorites() {
    return useQuery({
        queryKey: ['favorites'],
        queryFn: async () => {
            const res = await api.get<{ data: FavoriteItem[] }>('/api/favorites');
            return res.data;
        },
    });
}

export function useAddFavorite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (movieId: string) => {
            await api.post(`/api/favorites/${movieId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });
}

export function useRemoveFavorite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (movieId: string) => {
            await api.delete(`/api/favorites/${movieId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });
}

// Profiles
export interface Profile {
    id: string;
    name: string;
    avatarUrl: string | null;
    isKids: boolean;
    createdAt: string;
}

export function useProfiles() {
    return useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const res = await api.get<{ data: Profile[] }>('/api/profiles');
            return res.data;
        },
    });
}

export function useCreateProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { name: string; isKids?: boolean }) => {
            const res = await api.post<{ data: Profile }>('/api/profiles', input);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        },
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, input }: { id: string; input: Partial<Profile> }) => {
            const res = await api.put<{ data: Profile }>(`/api/profiles/${id}`, input);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        },
    });
}

export function useDeleteProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/profiles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        },
    });
}

// Rails Configuration
export interface RailConfig {
    id: string;
    name: string;
    type: string; // 'continue_watching' | 'for_you' | 'trending' | 'recent' | 'genre'
    genreId: string | null;
    position: number;
    isActive: boolean;
    genre: { id: string; name: string; slug: string } | null;
}

export function useRails() {
    return useQuery({
        queryKey: ['rails'],
        queryFn: async () => {
            const res = await api.get<{ data: RailConfig[] }>('/api/rails');
            return res.data;
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

export function useRecommendations(limit = 10) {
    return useQuery({
        queryKey: ['recommendations', limit],
        queryFn: async () => {
            const res = await api.get<RecommendationsResponse>(
                `/api/ai/recommendations?limit=${limit}`
            );
            return res;
        },
        retry: false, // Don't retry if AI service is down, just hide the rail
    });
}
