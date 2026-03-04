import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    ListObjectsV2Command,
    DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { getConfig } from './config';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
    if (!s3Client) {
        const config = getConfig();
        s3Client = new S3Client({
            endpoint: config.s3Endpoint,
            region: config.s3Region,
            credentials: {
                accessKeyId: config.s3AccessKey,
                secretAccessKey: config.s3SecretKey,
            },
            forcePathStyle: true,
        });
    }
    return s3Client;
}

export async function downloadFile(objectKey: string, destPath: string): Promise<void> {
    const config = getConfig();
    const client = getS3Client();

    console.log(`📥 Downloading ${objectKey} to ${destPath}`);

    const command = new GetObjectCommand({
        Bucket: config.s3Bucket,
        Key: objectKey,
    });

    const response = await client.send(command);

    if (!response.Body) {
        throw new Error(`Empty response body for key: ${objectKey}`);
    }

    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    await fs.promises.mkdir(destDir, { recursive: true });

    // Stream to file
    const writeStream = fs.createWriteStream(destPath);
    await pipeline(response.Body as Readable, writeStream);

    const stats = await fs.promises.stat(destPath);
    console.log(`✅ Downloaded ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

export async function uploadFile(
    localPath: string,
    objectKey: string,
    contentType: string
): Promise<void> {
    const config = getConfig();
    const client = getS3Client();

    const fileBuffer = await fs.promises.readFile(localPath);

    const command = new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: contentType,
    });

    await client.send(command);
}

export async function uploadDirectory(
    localDir: string,
    s3Prefix: string
): Promise<number> {
    console.log(`📤 Uploading directory ${localDir} to ${s3Prefix}`);

    let uploadCount = 0;

    async function uploadRecursive(currentDir: string, currentPrefix: string): Promise<void> {
        const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const localPath = path.join(currentDir, entry.name);
            const s3Key = `${currentPrefix}${entry.name}`;

            if (entry.isDirectory()) {
                await uploadRecursive(localPath, `${s3Key}/`);
            } else {
                // Determine content type
                let contentType = 'application/octet-stream';
                if (entry.name.endsWith('.m3u8')) {
                    contentType = 'application/vnd.apple.mpegurl';
                } else if (entry.name.endsWith('.ts')) {
                    contentType = 'video/mp2t';
                }

                await uploadFile(localPath, s3Key, contentType);
                uploadCount++;
            }
        }
    }

    await uploadRecursive(localDir, s3Prefix);

    console.log(`✅ Uploaded ${uploadCount} files to ${s3Prefix}`);
    return uploadCount;
}

export async function deletePrefix(prefix: string): Promise<void> {
    const config = getConfig();
    const client = getS3Client();

    console.log(`🗑️ Deleting objects with prefix: ${prefix}`);

    // List all objects with prefix
    const listCommand = new ListObjectsV2Command({
        Bucket: config.s3Bucket,
        Prefix: prefix,
    });

    const response = await client.send(listCommand);

    if (!response.Contents || response.Contents.length === 0) {
        console.log('   No objects to delete');
        return;
    }

    // Delete objects
    const deleteCommand = new DeleteObjectsCommand({
        Bucket: config.s3Bucket,
        Delete: {
            Objects: response.Contents.map((obj) => ({ Key: obj.Key })),
        },
    });

    await client.send(deleteCommand);
    console.log(`✅ Deleted ${response.Contents.length} objects`);
}
