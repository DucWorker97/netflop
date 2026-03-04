# apps/worker – Encode Worker Context

## Purpose
Background worker that consumes BullMQ jobs to encode videos to HLS format.

## Tech Stack
- **Runtime**: Node.js TypeScript
- **Queue**: BullMQ (Redis)
- **Encoder**: FFmpeg
- **Storage**: MinIO/S3 SDK

## Job Processing Flow
```
1. Consume ENCODE_HLS job from queue
2. Update DB: encodeStatus = 'processing'
3. Download original MP4 from MinIO
4. FFmpeg encode → HLS renditions (360p, 480p, 720p)
5. Upload HLS files to MinIO: hls/{movieId}/
6. Update DB: encodeStatus = 'ready', set playbackUrl
7. Cleanup temp files
```

## HLS Output Layout
```
hls/{movieId}/
├── master.m3u8
├── v360/playlist.m3u8 + segments
├── v480/playlist.m3u8 + segments
└── v720/playlist.m3u8 + segments
```

## FFmpeg Settings
- Segment duration: 6 seconds
- Codec: libx264 + AAC
- Presets: fast (balance speed/quality)

## Retry & Idempotency
- **Attempts**: 3 with exponential backoff (10s, 30s, 60s)
- **Idempotency**: Worker cleans output folder before encoding
- **Failure**: Sets encodeStatus = 'failed' with error message

## Environment Variables
```env
REDIS_URL           # BullMQ connection
S3_ENDPOINT         # MinIO endpoint
S3_BUCKET           # Storage bucket
API_INTERNAL_URL    # Callback URL (optional)
FFMPEG_PATH         # FFmpeg binary path
```

## Logging
- Always include: `jobId`, `movieId`, `requestId`
- Events: `encode:start`, `encode:progress`, `encode:complete`, `encode:failed`
