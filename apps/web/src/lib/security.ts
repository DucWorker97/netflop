const STRONG_PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const PASSWORD_REQUIREMENTS_HINT =
    'Use at least 8 characters with at least 1 letter and 1 number.';

export function getPasswordValidationError(password: string): string | null {
    return STRONG_PASSWORD_PATTERN.test(password) ? null : PASSWORD_REQUIREMENTS_HINT;
}
