# GemKit Configuration for Netflop

This guide covers GemKit setup and usage for the Netflop monorepo.

## Installation

```bash
# 1. Install GemKit CLI (requires Node >= 18)
npm install -g gemkit-cli

# 2. Initialize in repo
gk init

# 3. Verify installation
gk doctor
```

## Available Agents

| Agent | Purpose | Key Skills |
|-------|---------|------------|
| `netflop-api` | NestJS/Prisma development | nestjs-prisma, auth-rbac, presigned-upload |
| `netflop-worker-ffmpeg` | BullMQ/FFmpeg encoding | bullmq-job, ffmpeg-hls, observability |
| `netflop-mobile` | Expo React Native | expo-av, mobile-env, hls-playback |
| `netflop-qa` | E2E testing | qa-e2e-smoke, regression |
| `netflop-security` | Security auditing | security-bola, auth-rbac |

## Spawn Examples

### 1. API Development
```bash
gk agent spawn -a netflop-api \
  -p "Add pagination to GET /api/movies endpoint" \
  -c "@OPENAPI.yaml,@docs/ARCHITECTURE.md,@apps/api/prisma/schema.prisma"
```

### 2. Debug Encode Pipeline
```bash
gk agent spawn -a netflop-worker-ffmpeg \
  -p "Debug why encode job 123 is stuck" \
  -c "@docs/VIDEO_PIPELINE.md,@OBSERVABILITY.md"
```

### 3. Fix Mobile Playback
```bash
gk agent spawn -a netflop-mobile \
  -p "Video plays on web but fails on Android emulator" \
  -c "@apps/mobile/GEMINI.md,@.env"
```

### 4. Run Regression Tests
```bash
gk agent spawn -a netflop-qa \
  -p "Execute full regression checklist before v1.0 release" \
  -c "@CI_GATES.md,@scripts/ci/video-pipeline-smoke.sh"
```

### 5. Security Audit
```bash
gk agent spawn -a netflop-security \
  -p "Audit all movie endpoints for BOLA vulnerabilities" \
  -c "@docs/security/BOLA_AUDIT.md,@OPENAPI.yaml"
```

## Issue → Agent Mapping

| Problem | Agent | Skills to Add |
|---------|-------|---------------|
| API endpoint bug | `netflop-api` | nestjs-prisma |
| Auth/permissions issue | `netflop-api` | auth-rbac |
| Upload fails | `netflop-api` | presigned-upload |
| Encode stuck | `netflop-worker-ffmpeg` | bullmq-job, ffmpeg-hls |
| HLS not playing | `netflop-worker-ffmpeg` | ffmpeg-hls |
| Mobile can't connect | `netflop-mobile` | mobile-env |
| Video 403 on mobile | `netflop-mobile` | hls-playback, expo-av |
| E2E test failing | `netflop-qa` | qa-e2e-smoke |
| Pre-release validation | `netflop-qa` | regression |
| Security vulnerability | `netflop-security` | security-bola |
| Tracing/Logs issue | Any | observability |

## Context Files Reference

| Context | When to Include |
|---------|-----------------|
| `@OPENAPI.yaml` | Any API changes |
| `@docs/ARCHITECTURE.md` | Architecture decisions |
| `@docs/VIDEO_PIPELINE.md` | Upload/encode/playback |
| `@docs/DATABASE_SCHEMA.md` | Schema changes |
| `@docs/security/BOLA_AUDIT.md` | Security work |
| `@CI_GATES.md` | CI/testing work |
| `@OBSERVABILITY.md` | Logging/tracing |
| `@apps/api/prisma/schema.prisma` | Database work |
| `@apps/mobile/GEMINI.md` | Mobile development |
| `@.env` | Environment issues |

## Playbooks

Reference playbooks for common scenarios:
- `.agent/plans/playbook-upload-encode-error.md` - Upload/encode failures
- `.agent/plans/playbook-web-ok-mobile-fail.md` - Web vs Mobile issues
- `.agent/plans/netflop-triage-upload-playback.md` - General video triage

## Quick Commands

```bash
# List agents
gk agent list

# Get agent info
gk agent info netflop-api

# Search for agents by task
gk agent search "debug video playback"

# Health check
gk doctor
```

## Pitfalls & Tips

### Token/Context Limits
- Large context files (>100KB) may hit token limits
- Use specific file sections instead of entire files

### Environment Variables
- Mobile: Use `10.0.2.2` for Android emulator, not `localhost`
- Restart Metro after `.env` changes

### Mobile LAN Issues
- Physical devices need LAN IP (192.168.x.x)
- Check firewall allows connections
- Use `adb reverse` as alternative

### Source of Truth
Priority: **PRD > ARCHITECTURE > OpenAPI > Code**
