import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SecurityConfig } from '../config/security.config';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly mailConfig: SecurityConfig['mail'];
    private transporter: nodemailer.Transporter | null = null;

    constructor(configService: ConfigService) {
        this.mailConfig = configService.getOrThrow<SecurityConfig>('security').mail;

        if (this.mailConfig.enabled && this.mailConfig.provider === 'smtp') {
            this.transporter = nodemailer.createTransport({
                host: this.mailConfig.host,
                port: this.mailConfig.port,
                secure: this.mailConfig.secure,
                auth:
                    this.mailConfig.user && this.mailConfig.pass
                        ? { user: this.mailConfig.user, pass: this.mailConfig.pass }
                        : undefined,
            });

            this.transporter.verify().then(
                () => this.logger.log('SMTP mail transport ready'),
                (err: Error) => this.logger.error(`SMTP mail transport failed: ${err.message}`),
            );
        }
    }

    get isEnabled(): boolean {
        return this.mailConfig.enabled && !!this.transporter;
    }

    async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
        if (!this.isEnabled || !this.transporter) {
            this.logger.warn('Mail is disabled — skipping password reset email');
            return;
        }

        await this.transporter.sendMail({
            from: this.mailConfig.from || 'noreply@netflop.dev',
            to,
            subject: 'Reset your Netflop password',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset</h2>
                    <p>You requested a password reset for your Netflop account.</p>
                    <p>Click the button below to reset your password. This link expires in 1 hour.</p>
                    <a href="${resetUrl}" style="display: inline-block; background: #e50914; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
                        Reset Password
                    </a>
                    <p style="color: #888; font-size: 14px;">
                        If you didn't request this, you can safely ignore this email.
                    </p>
                </div>
            `,
        });

        this.logger.log(`Password reset email sent to ${to}`);
    }
}
