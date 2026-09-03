# Phase 2 — File Ingestion (Epic B)

> **Goal:** ให้ user เลือก/ลากไฟล์วิดีโอเข้ามา, validate, stage ลง OPFS, และดึง metadata
> **Depends on:** Phase 1 (app shell + project setup)

---

## Tasks

### B-1: Drag-and-Drop + File Picker Component
- [x] สร้าง `FileDropZone` component รองรับ:
  - Drag-and-drop (with visual feedback: highlight border, overlay text)
  - Click-to-browse file picker (`<input type="file" accept="video/*">`)
- [x] รองรับหลาย format: `.mp4`, `.mov`, `.webm`, `.mkv`, `.avi`
- [x] แสดง state: idle → dragging-over → processing → done/error
- [x] Mobile-friendly: ปุ่มใหญ่ชัดเจน, touch target เหมาะสม

### B-2: Client-Side Validation
- [x] ตรวจ file type (MIME type + extension whitelist)
- [x] ตรวจ file size (ตั้ง max limit พร้อม warning สำหรับไฟล์ใหญ่)
- [x] แสดง error message ชัดเจน:
  - "ไม่รองรับไฟล์นามสกุลนี้"
  - "ไฟล์ใหญ่เกินไป (>X GB)"
  - "ไฟล์เสียหาย / อ่านไม่ได้"
- [x] ไม่ block ถ้า MIME type detect ไม่ได้ — ให้ลองต่อแล้ว fail gracefully ที่ขั้น metadata

### B-3: OPFS (Origin Private File System) Staging
- [x] สร้าง `OPFSManager` module:
  - `writeFile(name, data): Promise<void>` — เขียนไฟล์ลง OPFS
  - `readFile(name): Promise<ArrayBuffer>` — อ่านกลับมา
  - `deleteFile(name): Promise<void>` — ลบไฟล์ temp
  - `listFiles(): Promise<string[]>` — list ไฟล์ที่มี
  - `getAvailableSpace(): Promise<number>` — เช็ค quota (ถ้า API มี)
- [x] ใช้ `navigator.storage.getDirectory()` + File System Access API
- [x] **Fallback:** ถ้า browser ไม่รองรับ OPFS → เก็บใน memory (`ArrayBuffer`) พร้อม warning ว่าไฟล์ใหญ่อาจ crash
- [x] Stream write สำหรับไฟล์ใหญ่ (ไม่โหลดทั้งก้อนเข้า memory ก่อน)

### B-4: Video Metadata Extraction
- [x] Integrate `mp4box.js` สำหรับ parse MP4/MOV container
- [x] Extract metadata:
  - Duration (seconds)
  - Resolution (width × height)
  - Video codec (e.g. H.264, H.265, VP9)
  - Audio codec (e.g. AAC, Opus) หรือ flag ว่าไม่มี audio track
  - Frame rate (fps)
  - Bitrate
  - Keyframe positions (สำหรับใช้ใน Phase 3 trim)
- [x] สร้าง `VideoMetadata` TypeScript type/interface
- [x] แสดง metadata บน UI:
  - ข้อมูลสั้น ๆ ใต้ file name (e.g. "1920×1080 • H.264 • 2:34 • 30fps")
  - Badge บอก compatibility ("WebCodecs ready ⚡" vs "ffmpeg.wasm required")
- [x] Handle non-MP4 files: ใช้ ffmpeg.wasm / HTML5 VideoElement probe เป็น fallback

---

## Definition of Done
- [x] ลากไฟล์ .mp4 เข้ามาได้ → แสดง metadata ถูกต้อง
- [x] ไฟล์ > 500MB ถูก stage ลง OPFS (ไม่กิน JS heap ทั้งก้อน)
- [x] ไฟล์ไม่รองรับ → แสดง error ชัดเจน
- [x] ทำงานบน mobile Chrome ได้
- [x] Unit tests สำหรับ validation logic และ metadata extraction

---

## Notes
- `mp4box.js` ทำ keyframe detection ได้ — เก็บข้อมูลนี้ไว้ใช้ตอน trim ใน Phase 3
- OPFS support: Chrome 86+, Firefox 111+, Safari 15.2+ — ค่อนข้างกว้างพอแล้ว แต่ยังต้องมี fallback
