import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Rendition, DEFAULT_RENDITIONS } from '../schemas/job.schema';
import ffmpegPath from 'ffmpeg-static';

interface FFmpegResult {
    success: boolean;
    durationMs: number;
    errorMessage?: string;
}

const resolvedFfmpegPath = process.env.FFMPEG_PATH || ffmpegPath || 'ffmpeg';

/**
 * Build FFmpeg arguments for multi-bitrate HLS encoding with master playlist
 */
export function buildFFmpegArgs(
    inputPath: string,
    outDir: string,
    renditions: Rendition[] = DEFAULT_RENDITIONS
): string[] {
    const numRenditions = renditions.length;

    // Build filter_complex for splitting and scaling
    const splitOutputs = renditions.map((_, i) => `[v${i}]`).join('');
    const scaleFilters = renditions
        .map((r, i) => `[v${i}]scale=w=${r.width}:h=${r.height}[v${i}out]`)
        .join(';');
    const filterComplex = `[0:v]split=${numRenditions}${splitOutputs};${scaleFilters}`;

    // Build map and codec args for each rendition
    const mapArgs: string[] = [];
    const varStreamParts: string[] = [];

    renditions.forEach((r, i) => {
        // Map video stream
        mapArgs.push('-map', `[v${i}out]`);
        // Map audio stream (if exists, will fallback if no audio)
        mapArgs.push('-map', '0:a?');

        // Video codec settings
        mapArgs.push(`-c:v:${i}`, 'libx264');
        mapArgs.push(`-b:v:${i}`, r.bitrate);
        mapArgs.push(`-preset:v:${i}`, 'fast');
        mapArgs.push(`-profile:v:${i}`, 'main');

        // Audio codec settings
        mapArgs.push(`-c:a:${i}`, 'aac');
        mapArgs.push(`-b:a:${i}`, '128k');
        mapArgs.push(`-ac:a:${i}`, '2');

        varStreamParts.push(`v:${i},a:${i}`);
    });

    const varStreamMap = varStreamParts.join(' ');

    const args = [
        '-y', // Overwrite output
        '-i', inputPath,
        '-filter_complex', filterComplex,
        ...mapArgs,
        '-f', 'hls',
        '-hls_time', '4',
        '-hls_playlist_type', 'vod',
        '-hls_flags', 'independent_segments',
        '-master_pl_name', 'master.m3u8',
        '-hls_segment_filename', path.join(outDir, 'v%v', 'seg_%03d.ts'),
        '-var_stream_map', varStreamMap,
        path.join(outDir, 'v%v', 'prog_index.m3u8'),
    ];

    return args;
}

/**
 * Build simpler FFmpeg args for single rendition (fallback)
 */
export function buildSimpleFFmpegArgs(
    inputPath: string,
    outDir: string,
    rendition: Rendition = DEFAULT_RENDITIONS[0]!
): string[] {
    return [
        '-y',
        '-i', inputPath,
        '-vf', `scale=w=${rendition.width}:h=${rendition.height}`,
        '-c:v', 'libx264',
        '-b:v', rendition.bitrate,
        '-preset', 'fast',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ac', '2',
        '-f', 'hls',
        '-hls_time', '4',
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', path.join(outDir, 'seg_%03d.ts'),
        path.join(outDir, 'prog_index.m3u8'),
    ];
}

/**
 * Run FFmpeg with the given arguments
 */
export async function runFFmpeg(args: string[]): Promise<FFmpegResult> {
    const startTime = Date.now();

    console.log('🎬 Running FFmpeg...');
    console.log(`   Command: ${resolvedFfmpegPath} ${args.slice(0, 10).join(' ')}...`);

    return new Promise((resolve) => {
        const ffmpeg = spawn(resolvedFfmpegPath, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stderrOutput = '';
        const maxStderrLength = 50000; // Limit stderr capture

        ffmpeg.stderr.on('data', (data: Buffer) => {
            const text = data.toString();
            if (stderrOutput.length < maxStderrLength) {
                stderrOutput += text;
            }
            // Log progress lines
            if (text.includes('frame=') || text.includes('time=')) {
                process.stdout.write('.');
            }
        });

        ffmpeg.on('close', (code) => {
            const durationMs = Date.now() - startTime;
            console.log(''); // New line after dots

            if (code === 0) {
                console.log(`✅ FFmpeg completed in ${(durationMs / 1000).toFixed(1)}s`);
                resolve({ success: true, durationMs });
            } else {
                // Extract last error lines
                const errorLines = stderrOutput.split('\n').slice(-20).join('\n');
                console.error(`❌ FFmpeg failed with code ${code}`);
                console.error(`   Error: ${errorLines.slice(0, 500)}`);
                resolve({
                    success: false,
                    durationMs,
                    errorMessage: `FFmpeg exited with code ${code}: ${errorLines.slice(0, 2000)}`,
                });
            }
        });

        ffmpeg.on('error', (err) => {
            const durationMs = Date.now() - startTime;
            console.error(`❌ FFmpeg spawn error (${resolvedFfmpegPath}): ${err.message}`);
            resolve({
                success: false,
                durationMs,
                errorMessage: `FFmpeg spawn error (${resolvedFfmpegPath}): ${err.message}`,
            });
        });
    });
}

/**
 * Create output directories for HLS segments
 */
export async function prepareOutputDirs(
    outDir: string,
    numVariants: number
): Promise<void> {
    await fs.promises.mkdir(outDir, { recursive: true });

    for (let i = 0; i < numVariants; i++) {
        const variantDir = path.join(outDir, `v${i}`);
        await fs.promises.mkdir(variantDir, { recursive: true });
    }
}

/**
 * Create a simple master playlist manually if FFmpeg doesn't create one
 */
export async function createMasterPlaylist(
    outDir: string,
    renditions: Rendition[]
): Promise<void> {
    const masterPath = path.join(outDir, 'master.m3u8');

    // Check if master already exists
    try {
        await fs.promises.access(masterPath);
        console.log('   Master playlist already exists');
        return;
    } catch {
        // Create it
    }

    let content = '#EXTM3U\n#EXT-X-VERSION:3\n';

    renditions.forEach((r, i) => {
        const bandwidth = parseInt(r.bitrate.replace('k', '')) * 1000;
        content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${r.width}x${r.height}\n`;
        content += `v${i}/prog_index.m3u8\n`;
    });

    await fs.promises.writeFile(masterPath, content);
    console.log('   Created master playlist manually');
}

/**
 * Verify HLS output is valid
 */
export async function verifyHlsOutput(outDir: string): Promise<boolean> {
    const masterPath = path.join(outDir, 'master.m3u8');

    try {
        const content = await fs.promises.readFile(masterPath, 'utf-8');
        if (!content.includes('#EXTM3U')) {
            console.error('❌ Invalid master playlist');
            return false;
        }
        console.log('✅ HLS output verified');
        return true;
    } catch (err) {
        console.error('❌ Master playlist not found');
        return false;
    }
}

/**
 * Cleanup temp directory
 */
export async function cleanupTempDir(dir: string): Promise<void> {
    try {
        await fs.promises.rm(dir, { recursive: true, force: true });
        console.log(`🧹 Cleaned up temp directory: ${dir}`);
    } catch (err) {
        console.warn(`⚠️ Failed to cleanup ${dir}:`, err);
    }
}

/**
 * Generate a thumbnail from video at specified time offset
 */
export async function generateThumbnail(
    inputPath: string,
    outputPath: string,
    timeOffset: number = 5
): Promise<{ success: boolean; errorMessage?: string }> {
    console.log(`🖼️ Generating thumbnail at ${timeOffset}s...`);

    const args = [
        '-y',
        '-ss', String(timeOffset),
        '-i', inputPath,
        '-vframes', '1',
        '-q:v', '2',
        '-vf', 'scale=640:-1',
        outputPath,
    ];

    return new Promise((resolve) => {
        const ffmpeg = spawn(resolvedFfmpegPath, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stderrOutput = '';

        ffmpeg.stderr.on('data', (data: Buffer) => {
            stderrOutput += data.toString();
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Thumbnail generated successfully');
                resolve({ success: true });
            } else {
                console.error(`❌ Thumbnail generation failed with code ${code}`);
                resolve({
                    success: false,
                    errorMessage: `FFmpeg exited with code ${code}: ${stderrOutput.slice(-500)}`,
                });
            }
        });

        ffmpeg.on('error', (err) => {
            console.error(`❌ Thumbnail spawn error (${resolvedFfmpegPath}): ${err.message}`);
            resolve({
                success: false,
                errorMessage: `FFmpeg spawn error (${resolvedFfmpegPath}): ${err.message}`,
            });
        });
    });
}

/**
 * Get video duration in seconds
 */
export async function getVideoDuration(inputPath: string): Promise<number | null> {
    console.log('⏱️ Extracting duration...');
    const args = ['-i', inputPath];

    return new Promise((resolve) => {
        const ffmpeg = spawn(resolvedFfmpegPath, args);
        let stderrOutput = '';

        ffmpeg.stderr.on('data', (data: Buffer) => {
            stderrOutput += data.toString();
        });

        ffmpeg.on('close', () => {
            // FFmpeg usually exits with 1 when just probing with -i, so we don't check code
            // format: Duration: 00:03:59.61, start: 0.000000, bitrate: 1478 kb/s
            const match = stderrOutput.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
            if (match) {
                const hours = parseFloat(match[1]);
                const minutes = parseFloat(match[2]);
                const seconds = parseFloat(match[3]);
                const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
                console.log(`✅ Duration extraction: ${totalSeconds.toFixed(2)}s`);
                resolve(totalSeconds);
            } else {
                console.warn('⚠️ Could not extract duration from ffmpeg output');
                resolve(null);
            }
        });

        ffmpeg.on('error', (err) => {
            console.error('❌ Duration extraction error:', err);
            resolve(null);
        });
    });
}
