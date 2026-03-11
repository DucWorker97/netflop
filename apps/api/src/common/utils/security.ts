import { BadRequestException } from '@nestjs/common';

export const MIN_PASSWORD_LENGTH = 8;
export const PASSWORD_POLICY_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;
export const PASSWORD_POLICY_MESSAGE =
    'Password must be at least 8 characters and include at least one letter and one number';

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function assertStrongPassword(password: string): void {
    if (password.length < MIN_PASSWORD_LENGTH || !PASSWORD_POLICY_REGEX.test(password)) {
        throw new BadRequestException({
            code: 'PASSWORD_TOO_WEAK',
            message: PASSWORD_POLICY_MESSAGE,
        });
    }
}
