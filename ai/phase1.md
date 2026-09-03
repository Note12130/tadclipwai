# Phase 1 — Project Scaffolding & Infra (Epic A)

> **Goal:** ตั้งโครงสร้างโปรเจกต์, dev server, CI pipeline และ app shell พื้นฐาน
> **Depends on:** ไม่มี (เริ่มได้เลย)

---

## Tasks

### A-1: Init Vite + React + TypeScript Project
- [x] สร้างโปรเจกต์ด้วย `npm create vite@latest` (React + TypeScript template)
- [x] จัดโครงสร้าง folder:
  ```
  src/
  ├── components/     # UI components
  ├── engine/         # Processing engine (WebCodecs + ffmpeg.wasm)
  ├── hooks/          # Custom React hooks
  ├── utils/          # Utility functions
  ├── workers/        # Web Worker scripts
  ├── types/          # TypeScript type definitions
  └── App.tsx
  ```
- [x] ติดตั้ง dependencies หลัก:
  - `mp4box` (MP4 container parsing)
  - `@ffmpeg/ffmpeg` + `@ffmpeg/core` (ffmpeg.wasm)
- [x] ติดตั้ง dev dependencies: `eslint`, `prettier`, `vitest`, `@playwright/test`

### A-2: Configure COOP/COEP Headers
- [x] เพิ่ม Vite plugin / middleware ใส่ headers บน dev server:
  ```
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  ```
- [x] เตรียม production config (e.g. `_headers` file for Netlify / `vercel.json`)
- [x] ทดสอบว่า `SharedArrayBuffer` available หลังตั้ง headers

### A-3: Setup CI Pipeline
- [x] สร้าง CI config (GitHub Actions / อื่น ๆ)
  - Lint (`eslint`)
  - Type check (`tsc --noEmit`)
  - Unit tests (`vitest run`)
  - E2E tests (`playwright test`)
- [x] ตั้ง Playwright config เบื้องต้น (browser list, base URL)
- [x] ตั้ง Vitest config

### A-4: No-Video-Upload CI Guard
- [x] เขียน custom ESLint rule หรือ CI script ตรวจจับ:
  - `fetch` / `XMLHttpRequest` ที่ส่ง body เป็น `video/*` หรือ `audio/*` mime type ไปยัง non-CDN origin
- [x] เพิ่มใน CI pipeline — fail build ถ้าเจอ
- [x] เขียน unit test สำหรับ guard rule

### A-5: Responsive App Shell (Mobile-First)
- [x] สร้าง layout component หลัก:
  - Header (app name, minimal controls)
  - Main area (จะเป็น video preview + editor ใน phase ถัดไป)
  - Bottom bar / action area
- [x] Mobile-first responsive design (ใช้งานได้ดีบนมือถือ)
- [x] Dark/Light theme foundation (optional, ถ้ามีเวลา)

---

## Definition of Done
- [x] `npm run dev` รันได้ไม่ error
- [x] COOP/COEP headers ตั้งถูกต้อง, `SharedArrayBuffer` ใช้งานได้
- [x] CI pipeline รัน lint + typecheck + test ผ่าน
- [x] App shell แสดงผลบนมือถือและ desktop ได้
- [x] No-upload guard ทำงานใน CI

---

## Notes
- ยังไม่ต้องมี feature จริง — focus ที่โครงสร้างและ infra ให้แข็งแรง
- COOP/COEP headers **จำเป็นมาก** สำหรับ ffmpeg.wasm (ต้องใช้ `SharedArrayBuffer`)
