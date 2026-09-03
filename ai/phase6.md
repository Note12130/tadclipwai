# Phase 6 — Polish & Edge Cases (Epic F)

> **Goal:** จัดการ edge cases, memory management, และ polish UX ให้พร้อม production
> **Depends on:** Phase 4 (Editing UI)

---

## Tasks

#### F-1: Video-With-No-Audio-Track
- [x] Detect ว่าวิดีโอไม่มี audio track (จาก metadata ใน Phase 2)
- [x] Handle ใน WebCodecs path: ไม่พยายาม process audio stream ที่ไม่มี
- [x] Handle ใน ffmpeg.wasm path: ใส่ `-an` flag ถ้าไม่มี audio
- [x] Concat: ถ้าบาง clip มี audio บางไม่มี → ใส่ silent audio track หรือ strip audio ทั้งหมด (ให้ user เลือก)
- [x] Unit test: trim/concat video-only file สำเร็จ

### F-2: Corrupted/Unsupported Input Files
- [x] จัดการ graceful failure สำหรับ:
  - ไฟล์ที่ download มาไม่ครบ (truncated)
  - Container ถูกต้องแต่ codec ไม่รองรับ (e.g. H.265 บน browser ที่ไม่ support)
  - ไฟล์ที่ extension ไม่ตรงกับ content จริง (e.g. .mp4 แต่เป็น text file)
- [x] แสดง error message ที่เข้าใจง่าย (ไม่ใช่ technical jargon):
  - "ไฟล์นี้อาจเสียหาย ลองดาวน์โหลดใหม่"
  - "รูปแบบวิดีโอนี้ยังไม่รองรับ ลองแปลงเป็น MP4 ก่อน"
- [x] ไม่ crash app — กลับสู่หน้า upload ได้เสมอ

### F-3: Memory Management
- [x] **Blob URL cleanup:**
  - `URL.revokeObjectURL()` เมื่อไม่ใช้แล้ว (เปลี่ยนไฟล์, export เสร็จ, etc.)
  - Track ทุก Blob URL ที่สร้าง ใน registry
- [x] **OPFS temp file cleanup:**
  - ลบ temp files หลัง export เสร็จ + user download แล้ว
  - ลบเมื่อ user เปลี่ยนไปใช้ไฟล์ใหม่
  - ลบตอน app startup (cleanup จาก session ก่อนที่ crash)
- [x] **WebCodecs resource cleanup:**
  - `.close()` ทุก `VideoFrame` ที่สร้าง (ป้องกัน GPU memory leak)
  - `.close()` encoder/decoder เมื่อ operation เสร็จ
- [x] **ffmpeg.wasm cleanup:**
  - Clear ffmpeg virtual FS หลัง operation
  - Release worker ถ้าไม่ใช้นาน (optional)
- [x] **Memory monitoring:**
  - ใช้ `performance.memory` (Chrome only) แสดง memory usage ใน debug panel
  - Warning ถ้า memory สูงเกินไป

### F-4: Low-End Device Warning
- [x] Detect low-end device/conditions:
  - `navigator.hardwareConcurrency` < 4 cores
  - `navigator.deviceMemory` < 4 GB
  - File size > threshold ที่ device น่าจะ handle ไม่ไหว
- [x] แสดง warning ก่อนเริ่ม slow-path operation:
  - "ไฟล์นี้ใหญ่ อุปกรณ์ของคุณอาจใช้เวลานาน ต้องการดำเนินการต่อหรือไม่?"
  - ให้ option: ดำเนินการต่อ / ยกเลิก / ลดคุณภาพ
- [x] ไม่ block — เป็น warning ไม่ใช่ error

### F-5: Basic PWA Setup
- [x] สร้าง `manifest.json`:
  - App name, icons, theme color
  - `display: standalone`
  - `start_url: /`
- [x] สร้าง Service Worker:
  - Cache app assets (HTML, JS, CSS, WASM)
  - ไม่ cache video files ของ user
  - Offline: แสดง app shell ได้ (แต่ต้องมีไฟล์ที่ user เลือกใหม่)
- [x] Add to Home Screen capable บน mobile
- [x] **Note:** Full offline functionality ไม่จำเป็นสำหรับ v1 — แค่ cache assets

---

## Definition of Done
- [x] Video ที่ไม่มี audio → trim/concat สำเร็จ ไม่ error
- [x] ไฟล์เสียหาย → error message ชัดเจน, app ไม่ crash
- [x] ไม่มี memory leak หลัง process ไฟล์หลายรอบ (ตรวจด้วย DevTools Memory tab)
- [x] Low-end warning แสดงบน device ที่ spec ต่ำ
- [x] PWA installable บน Chrome Android

---

## Notes
- Memory leak เป็นปัญหาที่พบบ่อยมากกับ WebCodecs — ต้อง test ละเอียด
- `VideoFrame.close()` **จำเป็นมาก** — ถ้าลืมจะ leak GPU memory อย่างรวดเร็ว
- PWA setup เป็น nice-to-have สำหรับ v1 แต่ตั้งฐานไว้สำหรับ future
