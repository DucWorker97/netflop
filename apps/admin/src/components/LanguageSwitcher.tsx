'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
    // Current locale provided by next-intl
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value;
        if (nextLocale === locale) return;

        // Logic: Replace the locale segment in the pathname
        // Current pathname might look like:
        // /vi/movies -> /en/movies
        // /movies -> /en/movies (if default is hidden, but next-intl usually handles prefixes)

        // Since we are inside [locale] routes and middleware handles prefixes, 
        // the pathname from `next/navigation` usually includes the locale prefix if it's there.
        // Let's simply replace the first segment if it matches a known locale, or prepend.

        let newPath = pathname;

        // Check if path starts with current locale
        const segments = pathname.split('/');
        // segments[0] is empty because of leading /
        // segments[1] is likely the locale

        if (segments[1] === locale) {
            segments[1] = nextLocale;
            newPath = segments.join('/');
        } else {
            // If explicit locale is missing (handled by default), prepend it?
            // Actually, for simplicity with next-intl standard flow:
            // Just use the path excluding locale and prepend new locale.
            // But stripping locale needs care.

            // Robust way:
            const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/';
            newPath = `/${nextLocale}${pathWithoutLocale}`;
            // Clean up double slashes just in case
            newPath = newPath.replace('//', '/');
        }

        router.push(newPath);
    };

    return (
        <select
            value={locale}
            onChange={handleChange}
            style={{
                background: '#333',
                color: '#fff',
                border: '1px solid #555',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
            }}
        >
            <option value="vi">🇻🇳 Tiếng Việt</option>
            <option value="en">🇺🇸 English</option>
        </select>
    );
}
