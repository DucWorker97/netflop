import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
    redisUrl: string;
    databaseUrl: string;
    s3Endpoint: string;
    s3AccessKey: string;
    s3SecretKey: string;
    s3Bucket: string;
    s3Region: string;
    tempDir: string;
}

let config: Config | null = null;

export function getConfig(): Config {
    if (!config) {
        config = {
            redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
            databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/netflop',
            s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
            s3AccessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
            s3SecretKey: process.env.S3_SECRET_KEY || 'minioadmin',
            s3Bucket: process.env.S3_BUCKET || 'netflop-media',
            s3Region: process.env.S3_REGION || 'us-east-1',
            tempDir: process.env.TEMP_DIR || (process.platform === 'win32' ? 'C:\\temp\\netflop' : '/tmp/netflop'),
        };
    }
    return config;
}
