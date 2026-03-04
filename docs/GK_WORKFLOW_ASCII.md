# GemKit Workflow (ASCII Safe)

This document provides a text-safe version of the Netflop GemKit workflows and structure, avoiding special characters that may cause encoding issues (mojibake) in some shells.

## 1. Netflop Worker Job Processing Flow

(Originally from `netflop-worker-ffmpeg.md`)

Scope:
- [x] Process jobs
- [x] Encode video
- [x] Upload HLS

Steps:
1. Consume ENCODE_HLS job from queue
2. Update DB: encodeStatus = 'processing'
3. Download original MP4 from MinIO to temp dir
4. Run FFmpeg encode (360p, 480p, 720p)
5. Generate master.m3u8 playlist
6. Upload all HLS files to MinIO: hls/{movieId}/
7. Update DB: encodeStatus = 'ready', set playbackUrl
8. Cleanup temp files

## 2. Directory Structure (ASCII verified)

Location: .gemini/

.gemini/
|-- agents/
|   |-- netflop-api.md
|   |-- netflop-mobile.md
|   |-- netflop-qa.md
|   |-- netflop-security.md
|   `-- netflop-worker-ffmpeg.md
|-- extensions/
|   |-- netflop-auth-rbac-rate-limit/
|   |-- netflop-bullmq-job-debug/
|   `-- (other netflop skills...)
`-- gk.json

## 3. Common Fixes

### Mojibake Fix for PowerShell
If you see characters like "â”œâ”€â”€", run:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001
```
