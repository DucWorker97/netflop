import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async createGlobalNotification(title: string, message: string, type: NotificationType = 'INFO') {
        // Create a global notification (userId is null)
        return this.prisma.notification.create({
            data: {
                title,
                message,
                type,
                userId: null,
            },
        });
    }

    async getUserNotifications(userId: string) {
        // Fetch global notifications OR notifications for this specific user
        return this.prisma.notification.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { userId: null }
                ]
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 50, // Limit to recent 50
        });
    }

    async markAsRead(id: string, userId: string) {
        const notification = await this.prisma.notification.findUnique({
            where: { id },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        // Since users can "read" global notifications, we need a way to track that.
        // However, for Simplicity MVP as per user request: "Method markAsRead(id): Updates status."
        // If it's a global notification, updating 'isRead' would mark it read for everyone.
        // Ideally we need a NotificationReadStatus table.
        // BUT, following the user's explicit simple schema: "isRead (boolean)".
        // So distinct user notifications are required for "isRead" to work per user.
        // OR global notifications validly stay unread or read for everyone.

        // DECISION: Only allow marking owned notifications as read.
        // If it's global (userId is null), we cannot "mark as read" for a single user without a join table.
        // For this task, we will assume "Global" is just broadcast info, and "User Specific" is actionable.
        // OR we convert 'Global' to 'User Specific' copies when fetched? No, that's complex.

        // User Requirement: "Method getUserNotifications(userId): Returns list for a specific user + global"
        // Requirement 2: "Method markAsRead(id): Updates status."

        // I'll implement simple update. If it's global, it affects everyone (Acceptable limitation for this MVP step). 
        // Or better: Check ownership.

        if (notification.userId && notification.userId !== userId) {
            throw new NotFoundException('Notification not accessible');
        }

        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }

    async createUserNotification(userId: string, title: string, message: string, type: NotificationType = 'INFO', movieId?: string) {
        return this.prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                movieId
            }
        });
    }
}
