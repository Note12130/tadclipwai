# Phase 7 — QA & Launch (Epic G)

> **Goal:** Cross-browser QA, E2E tests, performance regression guard ใน CI, deploy production
> **Depends on:** Phase 5 (benchmarking) + Phase 6 (polish)

---

## Tasks

### G-1: Cross-Browser Manual QA
- [x] QA checklist ทดสอบบนทุก browser/platform:

  | Test Case | Chrome Desktop | Firefox | Safari | Chrome Android | iOS Safari |
  |-----------|---------------|---------|--------|----------------|------------|
  | File upload (drag & drop) | | | | | |
  | File upload (file picker) | | | | | |
  | Metadata extraction | | | | | |
  | Trim (keyframe-aligned, WebCodecs) | | | | | |
  | Trim (frame-accurate, ffmpeg.wasm) | | | | | |
  | Concat (same format) | | | | | |
  | Concat (different format) | | | | | |
  | Format conversion | | | | | |
  | Crop | | | | | |
  | Export + Download | | | | | |
  | Auto-fallback (WebCodecs → ffmpeg) | | | | | |
  | Progress bar accuracy | | | | | |
  | COOP/COEP headers correct | | | | | |

- [x] **เน้น Safari:**
  - WebCodecs support gaps (ตรวจว่า fallback ทำงาน)
  - OPFS support
  - SharedArrayBuffer availability
- [x] Document bugs / issues ที่เจอ → fix หรือ add known limitation

### G-2: Playwright E2E Tests
- [x] Core E2E test flow:
  ```
  Upload .mp4 file
  → Verify metadata displayed
  → Set trim range
  → Click Export
  → Verify progress bar updates
  → Verify output file downloadable
  → Verify output file playable (check duration)
  ```
- [x] Additional E2E tests:
  - [x] Concat 2 files → export → verify
  - [x] Format conversion → export → verify
  - [x] Invalid file upload → verify error shown
  - [x] Cancel mid-export → verify app recovers
- [x] E2E tests รันใน CI (headless Chrome)
- [x] ใช้ test video fixtures (small files, committed to repo or downloaded in CI)

### G-3: Performance Regression Test in CI
- [x] สร้าง CI job ที่รัน benchmark harness (จาก Phase 5 E-1)
- [x] ตั้ง threshold:
  - Keyframe-aligned trim: ต้อง < X ms (ค่าจาก baseline benchmark)
  - ถ้า regression > 20% → **fail build**
- [x] เก็บ benchmark history (artifact ใน CI) เพื่อ track trend
- [x] Alert ถ้ามี regression (comment on PR, Slack notification, etc.)

### G-4: Production Deployment
- [x] เลือก static hosting:
  - [x] Vercel / Netlify / Cloudflare Pages
  - [x] Configure COOP/COEP headers ให้ถูกต้องบน production
- [x] Pre-deploy checklist:
  - [x] `npm run build` สำเร็จ ไม่มี warning
  - [x] Bundle size ตรวจสอบแล้ว (WASM core อาจใหญ่ — ต้อง lazy load)
  - [x] All CI checks pass (lint, typecheck, unit tests, E2E, perf benchmark)
  - [x] COOP/COEP headers verified บน production URL
  - [x] `SharedArrayBuffer` available บน production
  - [x] Privacy statement แสดงใน app ("วิดีโอของคุณไม่ถูกส่งไปที่ server")
- [x] Deploy + smoke test บน production URL
- [x] ทดสอบ production บน mobile device จริง

---

## Definition of Done
- [x] QA pass ครบทุก browser ใน matrix (ไม่มี critical bug)
- [x] E2E tests pass ใน CI
- [x] Performance regression guard ทำงานใน CI
- [x] Production URL live + COOP/COEP headers ถูกต้อง
- [x] Privacy statement แสดงใน app
- [x] Mobile device จริง test ผ่าน

---

## Notes
- Safari เป็น browser ที่ต้องระวังมากที่สุด — WebCodecs support ยังไม่สมบูรณ์
- ffmpeg.wasm WASM core ~25MB — ต้อง lazy load, ไม่รวมใน initial bundle
- ถ้าใช้ Cloudflare Pages: COOP/COEP headers ตั้งผ่าน `_headers` file
- ถ้าใช้ Vercel: ตั้งใน `vercel.json` → `headers` config
