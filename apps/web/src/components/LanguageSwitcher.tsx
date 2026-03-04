'use client';

import { usePathname, useRouter } from 'next/navigation';

export function LanguageSwitcher() {
    const pathname = usePathname();
    const router = useRouter();

    // Detect locale from path (assuming /en prefixed, otherwise vi)
    const isEnglish = pathname.startsWith('/en');
    const currentLocale = isEnglish ? 'en' : 'vi';

    const toggleLanguage = () => {
        const nextLocale = isEnglish ? 'vi' : 'en';
        let newPath;

        if (isEnglish) {
            // Switch to VI: remove /en prefix
            newPath = pathname.replace(/^\/en/, '') || '/';
            // If we want explicit /vi, use: pathname.replace(/^\/en/, '/vi')
            // But usually default locale has no prefix. Let's assume default is no prefix for VI.
        } else {
            // Switch to EN: add /en prefix
            newPath = `/en${pathname.startsWith('/') ? pathname : '/' + pathname}`;
        }

        router.push(newPath);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-black/20 text-white text-xs font-bold hover:bg-white/10 hover:border-white/40 transition-all"
            aria-label="Switch Language"
        >
            {currentLocale.toUpperCase()}
        </button>
    );
}
