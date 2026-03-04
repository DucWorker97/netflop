# Nightly Workflow & Log Correlation

## Overview
Implemented P0 requirements for nightly regression testing and full-stack log correlation.

## Changes

### 1. Nightly Video Smoke Workflow
- **File**: `.github/workflows/nightly-video-smoke.yml`
- **Schedule**: Daily at 02:00 UTC
- **Features**:
  - Runs `pnpm -w smoke:video`
  - Captures Docker logs (`compose.log`) & status (`compose_ps.txt`)
  - Uploads artifacts (`video-smoke-report.json`, logs) on success/failure

### 2. Log Correlation (Tracing)
Implemented end-to-end `requestId` propagation:
- **API**: Middleware injects `x-request-id`. `UploadService` logs `ENCODE_ENQUEUED` event with `requestId` and passes it to BullMQ.
- **Worker**: `EncodeJobSchema` updated to include `requestId`. `processor.ts` rewritten to use structured JSON logs with `requestId` in every line.
- **Traceability**: You can now grep a single UUID across `api.log` and `worker.log` to see the full lifecycle.

### 3. Observability Dashboard
- **Location**: `ops/grafana/dashboards/netflop-pipeline.json`
- **Features**:
  - Filter by `requestId`
  - Timeline of events (API -> Queue -> Worker -> S3)
  - Failure analysis view

## Verification Results

### Automated Checks
- `pnpm lint`: **PASSED** (Worker & API)
- `CI Gates`: Updated documentation in `docs/CI_GATES.md`

### Sample Correlation Log (Simulation)

**API Log:**
```json
{"service":"api","requestId":"550e84...","event":"ENCODE_ENQUEUED","jobId":"123","inputKey":"originals/..."}
```

**Worker Log:**
```json
{"service":"worker","requestId":"550e84...","event":"ENCODE_STARTED","jobId":"123"}
{"service":"worker","requestId":"550e84...","event":"ENCODE_PROGRESS","step":"ffmpeg_start"}
{"service":"worker","requestId":"550e84...","event":"ENCODE_READY","durationMs":45000}
```

## Next Steps
- Merge PR #4
- Configure GitHub Secrets (`S3_ACCESS_KEY` etc.) if running in real CI.
