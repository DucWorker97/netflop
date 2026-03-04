import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { getConfig } from './lib/config';
import { processEncodeJob } from './lib/processor';
import { disconnectPrisma } from './lib/database';
import { EncodeJobData } from './schemas/job.schema';

const QUEUE_NAME = 'encode';

async function main() {
    const config = getConfig();

    console.log('🎬 Starting Encode Worker...');
    console.log(`📡 Connecting to Redis: ${config.redisUrl}`);
    console.log(`📦 Database: ${config.databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
    console.log(`☁️  S3 Endpoint: ${config.s3Endpoint}`);
    console.log(`📂 Temp Directory: ${config.tempDir}`);

    const connection = new IORedis(config.redisUrl, {
        maxRetriesPerRequest: null,
    });

    connection.on('connect', () => {
        console.log('✅ Redis connected');
    });

    connection.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
    });

    const worker = new Worker<EncodeJobData>(
        QUEUE_NAME,
        async (job: Job<EncodeJobData>) => {
            await processEncodeJob(job);
        },
        {
            connection,
            concurrency: 1, // Single job at a time for FFmpeg resource usage
            lockDuration: 600000, // 10 min lock for long encodes
            stalledInterval: 60000, // Check for stalled jobs every minute
            maxStalledCount: 2, // Allow 2 stalls before failing
            settings: {
                // Exponential backoff: 10s, 30s, 60s
                backoffStrategy: (attemptsMade: number) => {
                    const delays = [10000, 30000, 60000, 120000];
                    return delays[Math.min(attemptsMade - 1, delays.length - 1)] || 120000;
                },
            },
        },
    );

    worker.on('ready', () => {
        console.log(`\n🚀 Worker ready! Listening on queue: ${QUEUE_NAME}`);
        console.log('   Waiting for encode jobs...\n');
    });

    worker.on('completed', (job: Job) => {
        console.log(`✅ Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job: Job | undefined, err: Error) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
        if (job && job.attemptsMade < (job.opts.attempts || 3)) {
            console.log(`   Will retry (attempt ${job.attemptsMade + 1}/${job.opts.attempts || 3})`);
        }
    });

    worker.on('error', (err: Error) => {
        console.error('❌ Worker error:', err);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        console.log(`\n🛑 Received ${signal}, shutting down worker...`);
        await worker.close();
        await connection.quit();
        await disconnectPrisma();
        console.log('👋 Worker stopped gracefully');
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle uncaught errors
    process.on('uncaughtException', (err) => {
        console.error('❌ Uncaught exception:', err);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
        console.error('❌ Unhandled rejection:', reason);
        process.exit(1);
    });
}

main().catch((err) => {
    console.error('❌ Failed to start worker:', err);
    process.exit(1);
});
