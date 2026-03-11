import { Job } from 'bullmq';
import * as path from 'path';
import { EncodeJobData, EncodeJobSchema, DEFAULT_RENDITIONS } from '../schemas/job.schema';
import { getConfig } from './config';
import { downloadFile, uploadDirectory, uploadFile } from './storage';
import {
    buildFFmpegArgs,
    buildSimpleFFmpegArgs,
    runFFmpeg,
    prepareOutputDirs,
    createMasterPlaylist,
    verifyHlsOutput,
    cleanupTempDir,
    generateThumbnail,
    getVideoDuration,
} from './ffmpeg';
import { getMovieStatus, getMovieInfo, claimJob, markReady, markFailed, updatePosterUrl } from './database';

/**
 * Main encode job processor
 */
/**
 * Structured logger
 */
function logEvent(event: string, context: Record<string, unknown>, message?: string) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'worker',
        env: process.env.NODE_ENV || 'development',
        event,
        message,
        ...context,
    }));
}

/**
 * Main encode job processor
 */
export async function processEncodeJob(job: Job<EncodeJobData>): Promise<void> {
    const startTime = Date.now();
    const jobId = job.id || 'unknown';
    // Attempt to parse requestId even if validation fails later
    const rawData = job.data as Record<string, unknown>;
    const requestId = rawData.requestId || 'unknown';
    const baseContext = { jobId, requestId, queue: 'encode' };

    logEvent('ENCODE_STARTED', baseContext, `Starting encode job ${jobId}`);

    // Validate job data
    const parseResult = EncodeJobSchema.safeParse(job.data);
    if (!parseResult.success) {
        logEvent('ENCODE_FAILED', { ...baseContext, error: parseResult.error.message }, 'Invalid job data');
        throw new Error(`Invalid job data: ${parseResult.error.message}`);
    }

    const { movieId, inputKey, outputPrefix } = parseResult.data;
    const renditions = parseResult.data.renditions || DEFAULT_RENDITIONS;
    const jobContext = { ...baseContext, movieId, uploadId: inputKey };

    logEvent('ENCODE_PARAMS', jobContext, `Input: ${inputKey}, Output: ${outputPrefix}`);

    const config = getConfig();
    const tempDir = path.join(config.tempDir, movieId);
    const inputPath = path.join(tempDir, 'input.mp4');
    const hlsDir = path.join(tempDir, 'hls');

    try {
        // Check if movie exists
        const movie = await getMovieStatus(movieId);
        if (!movie) {
            throw new Error(`Movie not found: ${movieId}`);
        }

        // Idempotency: skip if already ready
        if (movie.encodeStatus === 'ready' && movie.playbackUrl) {
            logEvent('ENCODE_SKIPPED', { ...jobContext, reason: 'already_ready' }, 'Movie already encoded');
            return;
        }

        // Idempotency: skip if already processing (claimed by another worker)
        if (movie.encodeStatus === 'processing') {
            logEvent('ENCODE_SKIPPED', { ...jobContext, reason: 'already_processing' }, 'Movie being processed by another worker');
            return;
        }

        // Atomically claim the job (PENDING -> PROCESSING)
        const claimed = await claimJob(movieId, jobId);
        if (!claimed) {
            logEvent('ENCODE_SKIPPED', { ...jobContext, reason: 'claim_failed' }, 'Could not claim job (already claimed or completed)');
            return;
        }

        // Step 1: Download input
        logEvent('ENCODE_PROGRESS', { ...jobContext, step: 'download' }, 'Downloading input file');
        await downloadFile(inputKey, inputPath);

        // Step 1.5: Extract duration
        const durationSeconds = await getVideoDuration(inputPath);
        if (durationSeconds) {
            logEvent('ENCODE_DURATION', { ...jobContext, durationSeconds }, `Video duration: ${durationSeconds}s`);
        }

        // Step 2: Prepare output directories
        await prepareOutputDirs(hlsDir, renditions.length);

        // Step 3: Run FFmpeg encode
        logEvent('ENCODE_PROGRESS', { ...jobContext, step: 'ffmpeg_start' }, 'Running FFmpeg');
        let result = await runFFmpeg(buildFFmpegArgs(inputPath, hlsDir, renditions));

        // Fallback to simple encode if multi-bitrate fails
        if (!result.success && renditions.length > 1) {
            logEvent('ENCODE_WARN', { ...jobContext, reason: 'multibitrate_failed' }, 'Multi-bitrate encode failed, trying single rendition');
            await prepareOutputDirs(hlsDir, 1);
            result = await runFFmpeg(buildSimpleFFmpegArgs(inputPath, hlsDir, renditions[0]));
        }

        if (!result.success) {
            throw new Error(result.errorMessage || 'FFmpeg encode failed');
        }

        // Step 4: Create master playlist if needed
        await createMasterPlaylist(hlsDir, renditions);
        const isValid = await verifyHlsOutput(hlsDir);
        if (!isValid) {
            throw new Error('HLS output verification failed');
        }

        // Step 5: Upload to S3
        logEvent('ENCODE_PROGRESS', { ...jobContext, step: 'upload' }, 'Uploading to storage');
        const uploadCount = await uploadDirectory(hlsDir, outputPrefix);
        logEvent('ENCODE_UPLOAD_STATS', { ...jobContext, uploadCount }, `Uploaded ${uploadCount} files`);

        // Step 5.5: Auto-generate thumbnail if movie has no poster
        const movieInfo = await getMovieInfo(movieId);
        if (!movieInfo?.posterUrl) {
            const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');
            const thumbResult = await generateThumbnail(inputPath, thumbnailPath, 5);

            if (thumbResult.success) {
                const thumbnailKey = `thumbnails/${movieId}.jpg`;
                await uploadFile(thumbnailPath, thumbnailKey, 'image/jpeg');
                await updatePosterUrl(movieId, thumbnailKey);
                logEvent('ENCODE_THUMBNAIL', { ...jobContext, thumbnailKey }, 'Generated and uploaded thumbnail');
            } else {
                logEvent('ENCODE_WARN', { ...jobContext, error: thumbResult.errorMessage }, 'Thumbnail generation failed');
            }
        }

        // Step 6: Update DB
        const masterKey = `${outputPrefix}master.m3u8`;
        const totalDuration = Date.now() - startTime;
        // Pass durationSeconds if available, fallback to undefined (or could be 0)
        await markReady(movieId, masterKey, totalDuration, durationSeconds || undefined);

        // Step 7: Cleanup
        await cleanupTempDir(tempDir);

        logEvent('ENCODE_READY', { ...jobContext, durationMs: totalDuration, masterKey }, 'Encode completed successfully');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logEvent('ENCODE_FAILED', { ...jobContext, error: errorMessage }, 'Encode failed');

        // Mark as failed in DB
        await markFailed(movieId, errorMessage);

        // Cleanup temp dir on failure too
        await cleanupTempDir(tempDir);

        // Re-throw to let BullMQ handle retry
        throw error;
    }
}
