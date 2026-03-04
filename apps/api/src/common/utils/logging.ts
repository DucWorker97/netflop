/**
 * Logging utilities for secure logging
 * 
 * SECURITY: Never log full presigned URLs - they contain signatures
 */

/**
 * Mask a presigned URL for logging
 * Removes query string (signature) but keeps path for debugging
 * 
 * @example
 * maskPresignedUrl('https://minio:9000/bucket/key?X-Amz-Signature=...')
 * // Returns: 'https://minio:9000/bucket/key?[MASKED]'
 */
export function maskPresignedUrl(url: string): string {
    try {
        const parsed = new URL(url);
        if (parsed.search) {
            return `${parsed.origin}${parsed.pathname}?[MASKED]`;
        }
        return url;
    } catch {
        // If URL parsing fails, mask everything after ?
        const qIndex = url.indexOf('?');
        if (qIndex > 0) {
            return url.substring(0, qIndex) + '?[MASKED]';
        }
        return url;
    }
}

/**
 * Mask an S3 object key for logging
 * Shortens long keys while preserving prefix/suffix for debugging
 */
export function maskObjectKey(key: string, maxLength = 40): string {
    if (key.length <= maxLength) return key;
    const start = key.substring(0, 15);
    const end = key.substring(key.length - 15);
    return `${start}...${end}`;
}

/**
 * Create a log-safe version of an object containing URLs
 * Recursively masks any properties that look like presigned URLs
 */
export function maskObjectForLogging<T extends Record<string, any>>(obj: T): T {
    const masked = { ...obj } as Record<string, any>;

    for (const key of Object.keys(masked)) {
        const value = masked[key];

        if (typeof value === 'string') {
            // Check if it looks like a presigned URL (contains signature params)
            if (
                value.includes('X-Amz-Signature') ||
                value.includes('X-Amz-Credential') ||
                value.includes('Signature=')
            ) {
                masked[key] = maskPresignedUrl(value);
            }
            // Check if it's a URL with query string
            else if (value.startsWith('http') && value.includes('?')) {
                masked[key] = maskPresignedUrl(value);
            }
        } else if (typeof value === 'object' && value !== null) {
            masked[key] = maskObjectForLogging(value);
        }
    }

    return masked as T;
}
