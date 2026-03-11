import { Suspense } from 'react';
import { LoginPageClient } from './LoginPageClient';

function LoginFallback() {
    return (
        <div className="loading-spinner" style={{ minHeight: '100vh' }}>
            <div className="spinner" />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginPageClient />
        </Suspense>
    );
}
