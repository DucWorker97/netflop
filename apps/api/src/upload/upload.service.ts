import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';
import { EncodeStatus, UploadFileType, UploadStatus, EncodeJobStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface PresignedUrlParams {
    movieId: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    fileType: 'video' | 'thumbnail';
    origin?: string;
}

interface UploadCompleteParams {
    movieId: string;
    objectKey: string;
    fileType?: 'video' | 'thumbnail';
    requestId?: string;
}

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);
    private s3PresignClient: S3Client;
    private bucket: string;
    private maxSizeBytes: number;
    private presignEndpoint: string;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        @InjectQueue('encode') private encodeQueue: Queue,
    ) {
        this.bucket = this.configService.get<string>('S3_BUCKET') || 'netflop-media';
        this.maxSizeBytes = (parseInt(this.configService.get<string>('UPLOAD_MAX_MB') || '500', 10)) * 1024 * 1024;

        this.presignEndpoint = this.resolvePresignEndpoint();
        this.s3PresignClient = this.buildPresignClient(this.presignEndpoint);
    }

    async getPresignedUrl(params: PresignedUrlParams) {
        const { movieId, fileName, contentType, sizeBytes, fileType, origin } = params;

        // Validate movie exists
        const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
        if (!movie) {
            throw new NotFoundException({
                code: 'MOVIE_NOT_FOUND',
                message: 'Movie not found',
            });
        }

        // Validate file size
        if (sizeBytes > this.maxSizeBytes) {
            throw new BadRequestException({
                code: 'FILE_TOO_LARGE',
                message: `File size exceeds maximum allowed (${this.maxSizeBytes / (1024 * 1024)}MB)`,
            });
        }

        // Validate content type
        if (fileType === 'video') {
            if (!contentType.startsWith('video/')) {
                throw new BadRequestException({
                    code: 'INVALID_CONTENT_TYPE',
                    message: 'Invalid content type for video upload',
                });
            }
        } else if (fileType === 'thumbnail') {
            if (!contentType.startsWith('image/')) {
                throw new BadRequestException({
                    code: 'INVALID_CONTENT_TYPE',
                    message: 'Invalid content type for thumbnail upload',
                });
            }
        }

        // Sanitize filename (remove path traversal)
        const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
        const uuid = uuidv4();
        const objectKey = fileType === 'video'
            ? `originals/${movieId}/${uuid}-${safeFileName}`
            : `posters/${movieId}/${uuid}-${safeFileName}`;

        const ttl = parseInt(this.configService.get<string>('UPLOAD_PRESIGNED_TTL_SECONDS') || '1800', 10);

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            ContentType: contentType,
            ContentLength: sizeBytes,
        });

        const presignClient = this.getPresignClient(origin);
        const uploadUrl = await getSignedUrl(presignClient, command, { expiresIn: ttl });

        const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

        return { uploadUrl, objectKey, expiresAt };
    }

    /**
     * Complete upload and enqueue encode job (IDEMPOTENT)
     * 
     * Idempotency guarantees:
     * 1. DB: Upload.objectKey has unique constraint
     * 2. DB: EncodeJob.inputKey has unique constraint
     * 3. Queue: BullMQ deduplication by encodeJob.id
     * 4. Logic: Skip if already processing/completed
     */
    async uploadComplete(params: UploadCompleteParams) {
        const { movieId, objectKey, fileType = 'video', requestId } = params;

        // Validate movie exists
        const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
        if (!movie) {
            throw new NotFoundException({
                code: 'MOVIE_NOT_FOUND',
                message: 'Movie not found',
            });
        }

        // IDEMPOTENT: Check if upload already exists
        const existingUpload = await this.prisma.upload.findUnique({
            where: { objectKey },
        });

        if (!existingUpload) {
            // Create upload record (unique constraint prevents duplicates)
            await this.prisma.upload.create({
                data: {
                    movieId,
                    objectKey,
                    fileType: fileType === 'video' ? UploadFileType.video : UploadFileType.thumbnail,
                    uploadStatus: UploadStatus.uploaded,
                },
            });
        }

        // For video uploads, update movie and enqueue encode job
        if (fileType === 'video') {
            return this.handleVideoUploadComplete(movieId, objectKey, requestId);
        }

        // For thumbnail uploads, update movie poster URL
        const publicUrl = `${this.configService.get<string>('S3_PUBLIC_BASE_URL') || 'http://localhost:9000/netflop-media'}/${objectKey}`;
        await this.prisma.movie.update({
            where: { id: movieId },
            data: { posterUrl: publicUrl },
        });

        return {
            movieId,
            encodeStatus: movie.encodeStatus,
            posterUrl: publicUrl,
        };
    }

    /**
     * Handle video upload completion with idempotent encode job enqueue
     */
    private async handleVideoUploadComplete(movieId: string, objectKey: string, requestId?: string) {
        // IDEMPOTENT: Check if EncodeJob already exists for this inputKey
        const existingJob = await this.prisma.encodeJob.findUnique({
            where: { inputKey: objectKey },
        });

        if (existingJob) {
            // Already exists - determine response based on status
            switch (existingJob.status) {
                case EncodeJobStatus.completed:
                    console.log(`[uploadComplete] Job already completed for inputKey=${this.maskKey(objectKey)}`);
                    return {
                        movieId,
                        encodeStatus: 'ready',
                        jobId: existingJob.id,
                        status: 'already_completed',
                    };

                case EncodeJobStatus.processing:
                case EncodeJobStatus.pending:
                    console.log(`[uploadComplete] Job already queued/processing for inputKey=${this.maskKey(objectKey)}`);
                    return {
                        movieId,
                        encodeStatus: existingJob.status,
                        jobId: existingJob.id,
                        status: 'already_queued',
                    };

                case EncodeJobStatus.failed:
                    // Reset failed job for retry
                    console.log(`[uploadComplete] Resetting failed job for retry, inputKey=${this.maskKey(objectKey)}`);
                    await this.prisma.encodeJob.update({
                        where: { id: existingJob.id },
                        data: {
                            status: EncodeJobStatus.pending,
                            errorMessage: null,
                            attempts: existingJob.attempts + 1,
                            startedAt: null,
                            completedAt: null,
                        },
                    });
                    // Re-enqueue the job
                    await this.enqueueEncodeJob(existingJob.id, movieId, objectKey, requestId);
                    return {
                        movieId,
                        encodeStatus: 'pending',
                        jobId: existingJob.id,
                        status: 'retry_queued',
                    };

                default:
                    // Fallthrough - shouldn't happen
                    break;
            }
        }

        // Update movie with original key and set encode status to pending
        await this.prisma.movie.update({
            where: { id: movieId },
            data: {
                originalKey: objectKey,
                encodeStatus: EncodeStatus.pending,
            },
        });

        // Create new encode job record (unique constraint prevents duplicates)
        const encodeJob = await this.prisma.encodeJob.create({
            data: {
                movieId,
                inputKey: objectKey,
                outputPrefix: `hls/${movieId}/`,
                status: EncodeJobStatus.pending,
                attempts: 0,
            },
        });

        // Enqueue BullMQ job
        await this.enqueueEncodeJob(encodeJob.id, movieId, objectKey, requestId);

        return {
            movieId,
            encodeStatus: 'pending',
            jobId: encodeJob.id,
            status: 'queued',
        };
    }

    /**
     * Enqueue encode job with deduplication and retry/backoff config
     */
    private async enqueueEncodeJob(encodeJobId: string, movieId: string, inputKey: string, requestId?: string) {
        // Use encodeJob.id for 1:1 mapping between DB and queue
        const jobId = `encode_${encodeJobId}`;

        await this.encodeQueue.add(
            'ENCODE_HLS',
            {
                requestId,
                movieId,
                inputKey,
                outputPrefix: `hls/${movieId}/`,
                renditions: [
                    { name: '360p', width: 640, height: 360, bitrate: '800k' },
                    { name: '480p', width: 854, height: 480, bitrate: '1400k' },
                    { name: '720p', width: 1280, height: 720, bitrate: '2800k' },
                    { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
                ],
            },
            {
                jobId,
                // Retry configuration
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 10000, // 10s, 20s, 40s
                },
                // Deduplication - prevent duplicate jobs for same encodeJobId
                // Using jobId as deduplication mechanism (BullMQ rejects duplicate jobIds)
                removeOnComplete: { count: 100, age: 86400 },
                removeOnFail: { count: 50, age: 86400 * 7 },
            },
        );

        this.logger.log(JSON.stringify({
            service: 'api',
            event: 'ENCODE_ENQUEUED',
            env: process.env.NODE_ENV || 'development',
            requestId,
            jobId,
            movieId,
            inputKey
        }));
    }

    /**
     * Mask S3 key for logging (don't expose full path)
     */
    private maskKey(key: string): string {
        if (key.length <= 20) return key;
        return key.substring(0, 10) + '...' + key.substring(key.length - 10);
    }

    async getSubtitlePresignedUrl(params: { movieId: string; fileName: string; origin?: string }) {
        const { movieId, fileName, origin } = params;

        // Validate movie exists
        const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
        if (!movie) {
            throw new NotFoundException({
                code: 'MOVIE_NOT_FOUND',
                message: 'Movie not found',
            });
        }

        // Sanitize filename
        const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
        const uuid = uuidv4();
        const objectKey = `subtitles/${movieId}/${uuid}-${safeFileName}`;

        const ttl = parseInt(this.configService.get<string>('UPLOAD_PRESIGNED_TTL_SECONDS') || '1800', 10);

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            ContentType: 'text/vtt',
        });

        const presignClient = this.getPresignClient(origin);
        const uploadUrl = await getSignedUrl(presignClient, command, { expiresIn: ttl });
        const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

        return { uploadUrl, objectKey, expiresAt };
    }

    async subtitleComplete(params: { movieId: string; objectKey: string }) {
        const { movieId, objectKey } = params;

        // Validate movie exists
        const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
        if (!movie) {
            throw new NotFoundException({
                code: 'MOVIE_NOT_FOUND',
                message: 'Movie not found',
            });
        }

        // Update movie subtitleUrl
        const subtitleUrl = objectKey;
        await this.prisma.movie.update({
            where: { id: movieId },
            data: { subtitleUrl },
        });

        return {
            movieId,
            subtitleUrl,
        };
    }

    private buildPresignClient(endpoint: string): S3Client {
        return new S3Client({
            endpoint,
            region: this.configService.get<string>('S3_REGION') || 'us-east-1',
            credentials: {
                accessKeyId: this.configService.get<string>('S3_ACCESS_KEY') || 'minioadmin',
                secretAccessKey: this.configService.get<string>('S3_SECRET_KEY') || 'minioadmin',
            },
            forcePathStyle: true,
        });
    }

    private getPresignClient(origin?: string): S3Client {
        const resolved = this.resolvePresignEndpoint(origin);
        if (resolved === this.presignEndpoint) return this.s3PresignClient;
        return this.buildPresignClient(resolved);
    }

    private resolvePresignEndpoint(origin?: string): string {
        const explicit = this.configService.get<string>('S3_PRESIGN_BASE_URL')?.trim();
        const fallback = this.configService.get<string>('S3_ENDPOINT')?.trim() || 'http://localhost:9000';
        const devHost = this.configService.get<string>('DEV_PUBLIC_HOST')?.trim();
        const devPort = this.configService.get<string>('DEV_MINIO_PORT')?.trim();
        const originHost = this.extractHost(origin);
        const preferredHost = this.pickPreferredHost(devHost, originHost);

        if (explicit) {
            if (preferredHost && this.shouldOverrideHost(explicit, preferredHost)) {
                const derived = this.buildEndpoint(explicit, preferredHost, devPort);
                this.warnOverride(explicit, derived, preferredHost, devHost, originHost);
                return derived;
            }
            return explicit;
        }

        if (preferredHost) {
            return this.buildEndpoint(fallback, preferredHost, devPort);
        }

        return fallback;
    }

    private extractHost(origin?: string): string | null {
        if (!origin) return null;
        if (origin === 'null') return null;
        try {
            const url = new URL(origin);
            return url.hostname || null;
        } catch {
            return null;
        }
    }

    private pickPreferredHost(devHost?: string, originHost?: string | null): string | null {
        if (devHost && !this.isLocalhostHost(devHost)) return devHost;
        if (originHost && !this.isLocalhostHost(originHost)) return originHost;
        return devHost || originHost || null;
    }

    private shouldOverrideHost(explicitEndpoint: string, preferredHost: string): boolean {
        if (this.isLocalhostHost(preferredHost)) return false;
        const explicitHost = this.extractHost(explicitEndpoint);
        if (!explicitHost) return false;
        return this.isLocalhostHost(explicitHost);
    }

    private buildEndpoint(baseUrl: string, host: string, port?: string): string {
        try {
            const base = new URL(baseUrl);
            const protocol = base.protocol || 'http:';
            const resolvedPort = port || base.port;
            return `${protocol}//${host}${resolvedPort ? `:${resolvedPort}` : ''}`;
        } catch {
            const resolvedPort = port ? `:${port}` : '';
            return `http://${host}${resolvedPort}`;
        }
    }

    private isLocalhostHost(host: string): boolean {
        const normalized = host.trim().toLowerCase();
        return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
    }

    private warnOverride(explicit: string, derived: string, preferredHost: string, devHost?: string, originHost?: string | null) {
        const nodeEnv = this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV || 'development';
        if (nodeEnv === 'production') return;
        this.logger.warn(
            `[upload] Overriding S3_PRESIGN_BASE_URL host for presign. ` +
            `explicit=${explicit} derived=${derived} preferredHost=${preferredHost} ` +
            `DEV_PUBLIC_HOST=${devHost || 'n/a'} originHost=${originHost || 'n/a'}`
        );
    }
}
