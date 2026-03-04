import { PrismaClient, EncodeStatus, EncodeJobStatus } from '@prisma/client';
import { getConfig } from './config';

let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
    if (!prisma) {
        const config = getConfig();
        prisma = new PrismaClient({
            datasources: {
                db: { url: config.databaseUrl },
            },
        });
    }
    return prisma;
}

export async function disconnectPrisma(): Promise<void> {
    if (prisma) {
        await prisma.$disconnect();
        prisma = null;
    }
}

/**
 * Check if movie exists and get current encode status
 */
export async function getMovieStatus(movieId: string) {
    const db = getPrisma();
    return db.movie.findUnique({
        where: { id: movieId },
        select: {
            id: true,
            encodeStatus: true,
            playbackUrl: true,
        },
    });
}

/**
 * Atomically claim a job for processing (PENDING -> PROCESSING)
 * Returns true if claimed successfully, false if already claimed by another worker
 */
export async function claimJob(movieId: string, jobId?: string): Promise<boolean> {
    const db = getPrisma();

    try {
        const result = await db.$transaction(async (tx) => {
            // Only update if current status is PENDING
            const job = await tx.encodeJob.findFirst({
                where: {
                    movieId,
                    status: EncodeJobStatus.pending,
                },
            });

            if (!job) {
                // No pending job found - either doesn't exist or already claimed
                return false;
            }

            // Atomically claim the job
            await tx.encodeJob.update({
                where: { id: job.id },
                data: {
                    status: EncodeJobStatus.processing,
                    startedAt: new Date(),
                },
            });

            // Update movie status
            await tx.movie.update({
                where: { id: movieId },
                data: { encodeStatus: EncodeStatus.processing },
            });

            return true;
        });

        if (result) {
            console.log(`📝 Claimed job for movie ${movieId}`);
        } else {
            console.log(`⚠️ Job for movie ${movieId} already claimed or not pending`);
        }

        return result;
    } catch (error) {
        console.error(`❌ Error claiming job for movie ${movieId}:`, error);
        return false;
    }
}

/**
 * Mark movie as processing (legacy - use claimJob instead)
 * @deprecated Use claimJob for atomic claim
 */
export async function markProcessing(movieId: string, jobId?: string): Promise<void> {
    const claimed = await claimJob(movieId, jobId);
    if (!claimed) {
        console.log(`⚠️ markProcessing: job not claimed for ${movieId}`);
    }
}

/**
 * Mark movie as ready with playback URL
 */
/**
 * Mark movie as ready with playback URL
 */
export async function markReady(
    movieId: string,
    masterKey: string,
    durationMs: number,
    videoDurationSeconds?: number
): Promise<void> {
    const db = getPrisma();

    await db.$transaction(async (tx) => {
        // Update movie status
        await tx.movie.update({
            where: { id: movieId },
            data: {
                encodeStatus: EncodeStatus.ready,
                playbackUrl: masterKey,
                ...(videoDurationSeconds ? { durationSeconds: Math.round(videoDurationSeconds) } : {}),
            },
        });

        // Update encode job
        await tx.encodeJob.updateMany({
            where: { movieId, status: EncodeJobStatus.processing },
            data: {
                status: EncodeJobStatus.completed,
                completedAt: new Date(),
            },
        });
    });

    console.log(`✅ Marked movie ${movieId} as ready (encode took ${(durationMs / 1000).toFixed(1)}s${videoDurationSeconds ? `, duration: ${videoDurationSeconds.toFixed(1)}s` : ''})`);
}

/**
 * Mark movie as failed
 */
export async function markFailed(movieId: string, errorMessage: string): Promise<void> {
    const db = getPrisma();
    const truncatedError = errorMessage.slice(0, 4000);

    await db.$transaction(async (tx) => {
        // Update movie status
        await tx.movie.update({
            where: { id: movieId },
            data: { encodeStatus: EncodeStatus.failed },
        });

        // Update encode job
        await tx.encodeJob.updateMany({
            where: { movieId, status: { in: [EncodeJobStatus.pending, EncodeJobStatus.processing] } },
            data: {
                status: EncodeJobStatus.failed,
                errorMessage: truncatedError,
                completedAt: new Date(),
            },
        });
    });

    console.log(`❌ Marked movie ${movieId} as failed`);
}

/**
 * Get movie info including posterUrl for thumbnail check
 */
export async function getMovieInfo(movieId: string) {
    const db = getPrisma();
    return db.movie.findUnique({
        where: { id: movieId },
        select: {
            id: true,
            posterUrl: true,
            encodeStatus: true,
            playbackUrl: true,
        },
    });
}

/**
 * Update movie posterUrl after auto-generating thumbnail
 */
export async function updatePosterUrl(movieId: string, posterUrl: string): Promise<void> {
    const db = getPrisma();

    await db.movie.update({
        where: { id: movieId },
        data: { posterUrl },
    });

    console.log(`🖼️ Updated posterUrl for movie ${movieId}`);
}
