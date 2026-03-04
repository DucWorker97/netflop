# CI Gates Documentation

## Overview

This document describes the CI/CD gates for the Netflop project. These gates ensure code quality and system health before merging changes.

## Gates Summary

| Gate | Type | Trigger | Timeout | Required |
|------|------|---------|---------|----------|
| **verify** | Quality | PR, Push main | 15 min | ✅ P0 |
| **smoke** | Health | PR, Push main | 10 min | ✅ P0 |
| **smoke:video** | E2E | Nightly, Manual | 30 min | ❌ Optional |

---

## verify (P0 Gate)

### Purpose
Ensures code quality by running lint, typecheck, and build checks.

### Pass Criteria
- ✅ `pnpm lint` exits with code 0
- ✅ `pnpm typecheck` exits with code 0
- ✅ `pnpm build` exits with code 0

### Fail Criteria
- ❌ Any of the above commands exits with non-zero code
- ❌ Script outputs which command failed

### Run Locally
```bash
# Using pnpm script
pnpm -w verify

# Or directly
./scripts/ci/verify.sh
```

### Expected Duration
- Local: 2-5 minutes (with turbo cache)
- CI: 5-10 minutes (cold cache)

---

## smoke (P0 Gate)

### Purpose
Verifies infrastructure health and API availability.

### Pass Criteria
- ✅ Docker services healthy: `postgres`, `redis`, `minio`
- ✅ API health endpoint returns HTTP 200: `GET /health`
- ✅ All checks complete within timeout (default: 120s)

### Fail Criteria
- ❌ Any Docker service not healthy within timeout
- ❌ API health check fails or times out
- ❌ Script outputs failing service and logs

### Run Locally
```bash
# Start infrastructure first
pnpm infra:up

# Wait for services, then run smoke
pnpm -w smoke

# Or directly with options
SMOKE_TIMEOUT=90 ./scripts/ci/smoke.sh
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `SMOKE_TIMEOUT` | 120 | Timeout in seconds |
| `API_URL` | http://localhost:3000 | API base URL |
| `ADMIN_URL` | http://localhost:3001 | Admin panel URL |
| `SKIP_COMPOSE_UP` | false | Skip docker compose up |

### Expected Duration
- Local: 1-2 minutes (services already running)
- CI: 3-5 minutes (cold start)

---

## smoke:video (Optional Gate)

### Purpose
End-to-end test of the video upload and encoding pipeline.

### Pass Criteria
- ✅ Can authenticate as admin
- ✅ Can create a new movie
- ✅ Can get presigned upload URL
- ✅ Can upload video to storage
- ✅ Can trigger encoding
- ✅ Encoding completes with status "ready"
- ✅ HLS playlist is accessible

### Fail Criteria
- ❌ Any API call fails
- ❌ Encoding doesn't reach "ready" within timeout
- ❌ Encoding fails with error
- ❌ HLS playlist not accessible

### Run Locally
```bash
# Ensure full stack is running (API + Worker)
pnpm infra:up
pnpm --filter @netflop/api dev &
pnpm --filter @netflop/worker dev &

# Run the smoke test
pnpm -w smoke:video

# Or directly
./scripts/ci/video-pipeline-smoke.sh
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | http://localhost:3000 | API base URL |
| `ADMIN_EMAIL` | admin@netflop.local | Admin email |
| `ADMIN_PASSWORD` | admin123 | Admin password |
| `ENCODE_TIMEOUT` | 300 | Encoding timeout (seconds) |

### Expected Duration
- Local: 1-3 minutes (depending on video size)
- CI: 5-15 minutes

### Prerequisites
- FFmpeg installed (`ffmpeg` command available)
- Worker service running
- Database seeded with admin user

---

## CI Workflow Details

### PR / Push to main (`.github/workflows/ci.yml`)

```
┌─────────────────────────────────────────────────────────┐
│                    CI Pipeline                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐     ┌──────────┐     ┌──────────────┐    │
│  │  verify  │ ──► │  smoke   │ ──► │ ci-complete  │    │
│  │  (P0)    │     │  (P0)    │     │   (summary)  │    │
│  └──────────┘     └──────────┘     └──────────────┘    │
│                                                         │
│  • Runs on every PR                                     │
│  • Runs on push to main                                 │
│  • Uses pnpm cache                                      │
│  • Concurrent runs cancelled                            │
└─────────────────────────────────────────────────────────┘
```

### Nightly Video Smoke (`.github/workflows/nightly-video-smoke.yml`)

```
┌─────────────────────────────────────────────────────────┐
│              Nightly Video Smoke Pipeline               │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────┐     ┌──────────────────────┐   │
│  │  video-pipeline-   │ ──► │  upload-artifacts    │   │
│  │      smoke         │     │  (logs/reports)      │   │
│  └────────────────────┘     └──────────────────────┘   │
│                                                         │
│  • Runs daily at 02:00 UTC                              │
│  • Manual trigger: "Nightly Video Smoke"                │
│  • Uploads execution logs and JSON report               │
│  • Cleans up Docker environment automatically           │
└─────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### verify fails

1. **Lint errors**: Run `pnpm lint` locally to see detailed errors
2. **Type errors**: Run `pnpm typecheck` to see type issues
3. **Build errors**: Check for missing dependencies or syntax errors

### smoke fails

1. **Docker not running**: Ensure Docker daemon is running
2. **Port conflicts**: Check if ports 5432, 6379, 9000 are free
3. **Service unhealthy**: Check logs with `docker compose logs <service>`
4. **API not responding**: Ensure API is built and started

### smoke:video fails

1. **FFmpeg not installed**: Install FFmpeg
2. **Auth fails**: Ensure database is seeded
3. **Encoding timeout**: Check worker logs
4. **Storage issues**: Check MinIO is accessible

---

## Adding New Gates

To add a new gate:

1. Create a script in `scripts/ci/`:
   ```bash
   #!/usr/bin/env bash
   source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
   # ... your gate logic ...
   ```

2. Add to `package.json`:
   ```json
   "my-gate": "bash scripts/ci/my-gate.sh"
   ```

3. Add to CI workflow if required on every PR

4. Document pass/fail criteria in this file
