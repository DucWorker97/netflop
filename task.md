# Nightly Workflow & Log Correlation

- [x] Create nightly video smoke workflow
    - [x] `.github/workflows/nightly-video-smoke.yml`
    - [x] Artifact upload step
- [x] Log Correlation
    - [x] API: `request-id` middleware logging standardized
    - [x] API: `UploadService` logs enqueue event with `requestId`
    - [x] Worker: `job.schema.ts` includes `requestId`
    - [x] Worker: `processor.ts` uses structured JSON logs with `requestId`
- [x] Dashboards & Docs
    - [x] `ops/grafana/README.md` and dashboard JSON
    - [x] `docs/OBSERVABILITY.md` updated
    - [x] `docs/CI_GATES.md` updated
- [x] Scripting
    - [x] `scripts/ci/video-pipeline-smoke.sh`: Request ID handling & JSON report
- [ ] Verification
    - [/] CI Gates (`lint`, `typecheck`)
    - [ ] Manual smoke test (optional)
