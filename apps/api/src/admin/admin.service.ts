import { Injectable, Logger, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        @InjectQueue('encode') private readonly encodeQueue: Queue,
    ) { }

    async getDiagnostics() {
        const diagnostics: Record<string, unknown> = {
            timestamp: new Date().toISOString(),
            database: { status: 'unknown' },
            redis: { status: 'unknown' },
            storage: { status: 'unknown' },
        };

        // Check database
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            diagnostics.database = { status: 'connected' };
        } catch (err) {
            diagnostics.database = { status: 'error', message: String(err).slice(0, 200) };
        }

        // Check Redis
        try {
            const redisUrl = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
            const redis = new Redis(redisUrl);
            const pong = await redis.ping();
            await redis.quit();
            diagnostics.redis = { status: pong === 'PONG' ? 'connected' : 'error' };
        } catch (err) {
            diagnostics.redis = { status: 'error', message: String(err).slice(0, 200) };
        }

        // Check S3/MinIO
        try {
            const s3Client = new S3Client({
                endpoint: this.config.get<string>('S3_ENDPOINT'),
                region: this.config.get<string>('S3_REGION') || 'us-east-1',
                credentials: {
                    accessKeyId: this.config.get<string>('S3_ACCESS_KEY') || '',
                    secretAccessKey: this.config.get<string>('S3_SECRET_KEY') || '',
                },
                forcePathStyle: true,
            });

            await s3Client.send(
                new HeadBucketCommand({
                    Bucket: this.config.get<string>('S3_BUCKET') || 'netflop-media',
                })
            );
            diagnostics.storage = { status: 'connected', bucket: this.config.get<string>('S3_BUCKET') };
        } catch (err) {
            diagnostics.storage = { status: 'error', message: String(err).slice(0, 200) };
        }

        return diagnostics;
    }

    async getEncodeJobs(movieId?: string) {
        const where = movieId ? { id: movieId } : {};

        const movies = await this.prisma.movie.findMany({
            where,
            select: {
                id: true,
                title: true,
                encodeStatus: true,
                originalKey: true,
                playbackUrl: true,
                createdAt: true,
                updatedAt: true,
                encodeJobs: {
                    select: {
                        id: true,
                        status: true,
                        errorMessage: true,
                        startedAt: true,
                        completedAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updatedAt: 'desc' },
            take: 50,
        });

        return {
            count: movies.length,
            jobs: movies.map((m: typeof movies[number]) => ({
                movieId: m.id,
                title: m.title,
                encodeStatus: m.encodeStatus,
                originalKey: m.originalKey,
                playbackUrl: m.playbackUrl,
                latestJob: m.encodeJobs[0] || null,
                createdAt: m.createdAt,
                updatedAt: m.updatedAt,
            })),
        };
    }

    /**
     * Get queue summary using BullMQ queue.getJobCounts()
     */
    async getQueueSummary() {
        try {
            const counts = await this.encodeQueue.getJobCounts(
                'waiting',
                'active',
                'completed',
                'failed',
                'delayed',
                'paused'
            );

            return {
                queue: 'encode',
                timestamp: new Date().toISOString(),
                counts,
            };
        } catch (err) {
            this.logger.error(`Failed to get queue counts: ${err}`);
            return {
                queue: 'encode',
                error: String(err).slice(0, 200),
            };
        }
    }

    /**
     * Get users with pagination and filtering
     */
    async getUsers(options: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
    }) {
        const page = options.page || 1;
        const limit = Math.min(options.limit || 10, 100);
        const skip = (page - 1) * limit;

        const where: any = {};

        if (options.search) {
            where.email = { contains: options.search, mode: 'insensitive' };
        }

        if (options.role && (options.role === 'admin' || options.role === 'viewer')) {
            where.role = options.role;
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            favorites: true,
                            watchHistory: true,
                            ratings: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users.map((user: typeof users[number]) => ({
                id: user.id,
                email: user.email,
                role: user.role,
                status: 'active', // All users are active by default (no status field in schema)
                createdAt: user.createdAt,
                lastLoginAt: user.updatedAt, // Using updatedAt as proxy
                stats: {
                    favorites: user._count.favorites,
                    watchHistory: user._count.watchHistory,
                    ratings: user._count.ratings,
                }
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        };
    }

    /**
     * Create a new user (admin only action)
     */
    async createUser(params: { email: string; password: string; role?: UserRole }) {
        const existing = await this.prisma.user.findUnique({ where: { email: params.email } });
        if (existing) {
            throw new ConflictException({
                code: 'EMAIL_ALREADY_EXISTS',
                message: 'Email already registered',
            });
        }

        const passwordHash = await bcrypt.hash(params.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: params.email,
                passwordHash,
                role: params.role || UserRole.viewer,
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    /**
     * Update user fields (admin only action)
     */
    async updateUser(params: { userId: string; email?: string; role?: UserRole; password?: string }) {
        const { userId, email, role, password } = params;

        if (!email && !role && !password) {
            throw new BadRequestException({
                code: 'NO_FIELDS',
                message: 'At least one field must be provided',
            });
        }

        if (email) {
            const existing = await this.prisma.user.findUnique({ where: { email } });
            if (existing && existing.id !== userId) {
                throw new ConflictException({
                    code: 'EMAIL_ALREADY_EXISTS',
                    message: 'Email already registered',
                });
            }
        }

        const data: Record<string, unknown> = {};
        if (email) data.email = email;
        if (role) data.role = role;
        if (password) {
            data.passwordHash = await bcrypt.hash(password, 10);
        }

        const user = await this.prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    /**
     * Delete user (admin only action)
     */
    async deleteUser(userId: string) {
        const existing = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!existing) {
            throw new NotFoundException({
                code: 'USER_NOT_FOUND',
                message: 'User not found',
            });
        }

        await this.prisma.user.delete({ where: { id: userId } });
        return { id: userId };
    }
}

