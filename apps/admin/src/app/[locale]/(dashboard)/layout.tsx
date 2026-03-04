'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import styles from './dashboard.module.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Extract locale from pathname (e.g., /vi/movies -> vi)
    const locale = useMemo(() => {
        const match = pathname.match(/^\/(vi|en)(\/|$)/);
        return match ? match[1] : 'vi';
    }, [pathname]);

    // Strip locale prefix for active state comparison
    const pathWithoutLocale = useMemo(() => {
        return pathname.replace(/^\/(vi|en)/, '') || '/';
    }, [pathname]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push(`/${locale}/login`);
        }
    }, [isLoading, isAuthenticated, router, locale]);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <span className={styles.logoText}>netflop</span>
                    <span className={styles.logoSubtext}>Admin</span>
                </div>

                <nav className={styles.nav}>
                    <Link
                        href={`/${locale}`}
                        className={`${styles.navItem} ${pathWithoutLocale === '/' ? styles.navItemActive : ''}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                        </svg>
                        Dashboard
                    </Link>
                    <Link
                        href={`/${locale}/movies`}
                        className={`${styles.navItem} ${pathWithoutLocale.startsWith('/movies') ? styles.navItemActive : ''}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                        </svg>
                        Movies
                    </Link>
                    <Link
                        href={`/${locale}/genres`}
                        className={`${styles.navItem} ${pathWithoutLocale.startsWith('/genres') ? styles.navItemActive : ''}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
                        </svg>
                        Genres
                    </Link>
                    <Link
                        href={`/${locale}/analytics`}
                        className={`${styles.navItem} ${pathWithoutLocale.startsWith('/analytics') ? styles.navItemActive : ''}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                        </svg>
                        Analytics
                    </Link>
                    <Link
                        href={`/${locale}/users`}
                        className={`${styles.navItem} ${pathWithoutLocale.startsWith('/users') ? styles.navItemActive : ''}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                        </svg>
                        Users
                    </Link>
                    <Link
                        href={`/${locale}/rails`}
                        className={`${styles.navItem} ${pathWithoutLocale.startsWith('/rails') ? styles.navItemActive : ''}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                        </svg>
                        Rails
                    </Link>
                    <Link
                        href={`/${locale}/actors`}
                        className={`${styles.navItem} ${pathWithoutLocale.startsWith('/actors') ? styles.navItemActive : ''}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                        Actors
                    </Link>
                    <Link
                        href={`/${locale}/subtitles`}
                        className={`${styles.navItem} ${pathWithoutLocale.startsWith('/subtitles') ? styles.navItemActive : ''}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z" />
                        </svg>
                        Subtitles
                    </Link>
                    <Link
                        href={`/${locale}/settings`}
                        className={`${styles.navItem} ${pathWithoutLocale.startsWith('/settings') ? styles.navItemActive : ''}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.14,12.94c0.04-0.31,0.06-0.63,0.06-0.94c0-0.31-0.02-0.63-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.37,4.82,11.69,4.82,12s0.02,0.63,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                        </svg>
                        Settings
                    </Link>
                    <Link
                        href={`/${locale}/logs`}
                        className={`${styles.navItem} ${pathWithoutLocale.startsWith('/logs') ? styles.navItemActive : ''}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                        Logs
                    </Link>
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <span className={styles.userEmail}>{user?.email}</span>
                        <span className={styles.userRole}>{user?.role}</span>
                    </div>
                    <button onClick={logout} className={styles.logoutBtn}>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
