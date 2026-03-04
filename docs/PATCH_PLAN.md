# Patch Plan: Fix Parallel Playback + Upload Issues

> **Date**: 2026-01-17  
> **Target**: Web + Mobile xem song song + Admin upload OK

---

## 1. Summary - Root Causes (Chắc chắn: HIGH)

| # | Root Cause | Độ chắc chắn |
|---|------------|--------------|
| 1 | **ENV Mismatch**: `.env` có `DEV_PUBLIC_HOST=localhost` nhưng `S3_PUBLIC_BASE_URL`, `S3_PRESIGN_BASE_URL` và `EXPO_PUBLIC_*` hardcode `10.0.2.2`. Web browser không resolve được `10.0.2.2` → không phát video, không upload được. | **HIGH** |
| 2 | **Không dynamic derive**: Các URL công khai không được tự động sinh từ `DEV_PUBLIC_HOST`, phải sửa thủ công nhiều chỗ. | **HIGH** |
| 3 | **MinIO CORS có thể thiếu**: Nếu bucket chưa config CORS cho `localhost:3001` (Admin origin), presigned PUT sẽ fail với CORS error. | **MEDIUM** |

**Kết luận**: Sửa `.env` để thống nhất host giữa các biến là fix chính. Tạo 3 profile env để dễ switch.

---

## 2. Patch Files Created

| File | Mục đích |
|------|----------|
| `.env.web.local` | Web-only dev - tất cả `localhost` |
| `.env.mobile.emu` | Android Emulator-only - tất cả `10.0.2.2` |
| `.env.lan.local` | **Web + Mobile song song** - dùng IP LAN |
| `minio-cors.xml` | CORS config cho MinIO bucket |

---

## 3. Cách sử dụng

### Option A: Web-only (nhanh nhất)
```powershell
# Copy profile vào .env
Copy-Item .env.web.local .env -Force

# Restart services
# Ctrl+C để dừng dev:core hiện tại, sau đó:
pnpm dev:core
```

### Option B: Mobile Emulator-only
```powershell
Copy-Item .env.mobile.emu .env -Force
pnpm dev:core
```

### Option C: Web + Mobile Song Song (RECOMMENDED)
```powershell
# 1. Tìm IP LAN của máy
ipconfig | findstr "IPv4"
# Output: IPv4 Address. . . . . . . . : 192.168.1.23

# 2. Sửa .env.lan.local: thay 192.168.1.100 bằng IP thực
# Mở file và find-replace: 192.168.1.100 -> 192.168.1.23

# 3. Copy vào .env
Copy-Item .env.lan.local .env -Force

# 4. Restart services
pnpm dev:core
```

---

## 4. MinIO CORS Setup

```powershell
# 1. Ensure mc (MinIO Client) is available
# If not installed: https://min.io/docs/minio/linux/reference/minio-mc.html

# 2. Set alias (nếu chưa có)
mc alias set local http://localhost:9000 minioadmin minioadmin

# 3. Apply CORS config (Choose ONE)

# Option A: LAN Development (Strict - Recommended)
# Edit minio-cors.lan.xml to include your LAN IP first!
mc cors set local/netflop-media ./minio-cors.lan.xml

# Option B: Open Dev (Wildcard - Lazy/Fast)
mc cors set local/netflop-media ./minio-cors.dev-open.xml

# 4. Verify
mc cors get local/netflop-media
```

**Reference**: [MinIO mc cors documentation](https://min.io/docs/minio/linux/reference/minio-mc/mc-cors.html)

---

## 5. Verification Checklist

### After switching to `.env.web.local`:
| # | Test | Command | Expected |
|---|------|---------|----------|
| 1 | API health | `curl http://localhost:3000/health` | `{"status":"ok"}` |
| 2 | Master playlist | `curl -I http://localhost:9000/netflop-media/hls/{movieId}/master.m3u8` | HTTP 200 |
| 3 | Segment | `curl -I http://localhost:9000/netflop-media/hls/{movieId}/v0/seg_000.ts` | HTTP 200 |
| 4 | Web playback | Mở `http://localhost:3002/movies/{id}` → Play | Video plays |
| 5 | Admin upload | Admin → Create movie → Upload → Network tab | PUT 200, no CORS error |

### After switching to `.env.lan.local`:
| # | Test | Command | Expected |
|---|------|---------|----------|
| 1 | Web playback | Mở `http://192.168.1.x:3002/movies/{id}` → Play | Video plays |
| 2 | Mobile playback | Open app on emulator/device → Play movie | Video plays |
| 3 | Parallel | Bật cả Web và Mobile cùng lúc | Cả 2 đều play OK |

---

## 6. Quick Curl Tests

```powershell
# Variables (thay bằng giá trị thực)
$MOVIE_ID = "your-movie-uuid"
$HOST = "localhost"  # hoặc IP LAN

# Test master.m3u8
curl -v "http://${HOST}:9000/netflop-media/hls/${MOVIE_ID}/master.m3u8"

# Test segment (thay v0/seg_000.ts nếu tên khác)
curl -v "http://${HOST}:9000/netflop-media/hls/${MOVIE_ID}/v0/seg_000.ts"

# Test API stream endpoint (cần token)
curl -v "http://${HOST}:3000/api/movies/${MOVIE_ID}/stream" `
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 7. Troubleshooting

| Triệu chứng | Nguyên nhân | Fix |
|-------------|-------------|-----|
| Web: "Failed to load resource" | `playbackUrl` chứa `10.0.2.2` | Copy `.env.web.local` vào `.env`, restart |
| Mobile: "Network request failed" | `EXPO_PUBLIC_*` sai IP | Copy đúng profile, rebuild Expo |
| Admin upload: CORS error | MinIO chưa có CORS | Apply `minio-cors.xml` |
| Cả 2 không xem được | IP LAN sai hoặc firewall | Check `ipconfig`, tắt firewall tạm |

---

## 8. Files Modified/Created

| Path | Action |
|------|--------|
| `.env.web.local` | **NEW** - Web-only profile |
| `.env.mobile.emu` | **NEW** - Emulator-only profile |
| `.env.lan.local` | **NEW** - Parallel dev profile |
| `minio-cors.xml` | **NEW** - CORS config |
| `.env` | **MODIFY** - Copy from profile |
