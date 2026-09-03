# Phase 4 — Editing UI (Epic D)

> **Goal:** สร้าง UI สำหรับ preview, trim, concat, crop/format และ export workflow
> **Depends on:** Phase 2 (file ingestion) + Phase 3 (processing engine)

---

## Tasks

### D-1: Video Preview Player
- [x] สร้าง `VideoPlayer` component:
  - ใช้ native `<video>` element bound to Blob URL
  - Play/Pause, Seek, Volume controls
  - แสดง current time / total duration
- [x] รองรับ Blob URL จากทั้ง input file และ processed output
- [x] Keyboard shortcuts: Space (play/pause), ← → (seek ±5s)
- [x] Mobile: tap to play/pause, swipe to seek (optional)

### D-2: Trim Handles / Scrubber Timeline
- [x] สร้าง `Timeline` component (Canvas-based หรือ DOM-based):
  - แสดง video duration เป็น bar แนวนอน
  - Thumbnail strip (extract frames จากวิดีโอ) — optional, ถ้า perf ดีพอ
- [x] **Trim handles:**
  - [x] Drag handle ซ้าย = set start time
  - [x] Drag handle ขวา = set end time
  - [x] Highlighted region ระหว่าง handles = ส่วนที่จะ keep
  - [x] แสดง timecode บน handles (e.g. "00:15.3")
- [x] **Snap-to-keyframe option:**
  - [x] Toggle "Snap to keyframe" (default: on)
  - [x] เมื่อเปิด: snap handles ไป nearest keyframe → ใช้ WebCodecs fast path
  - [x] เมื่อปิด: frame-accurate → ใช้ ffmpeg.wasm
  - [x] แสดง indicator ว่า "⚡ Fast trim" vs "🐢 Accurate trim (slower)"
- [x] Playback position indicator (playhead) บน timeline
- [x] Video player sync กับ timeline (click timeline → seek video)

### D-3: Multi-Clip Queue (Concat/Merge)
- [x] สร้าง `ClipQueue` component:
  - [x] เพิ่มหลายไฟล์เข้า queue
  - [x] แสดง thumbnail + metadata ของแต่ละ clip
  - [x] Drag-to-reorder clips
  - [x] ลบ clip ออกจาก queue
- [x] **Compatibility indicator:**
  - [x] เช็คว่าทุก clip มี same codec/resolution/fps หรือไม่
  - [x] ✅ "Same format — fast merge ⚡" (WebCodecs stream copy)
  - [x] ⚠️ "Different formats — needs re-encoding (slower)" (ffmpeg.wasm)
- [x] แสดง estimated output duration (sum of all clips)

### D-4: Format / Crop / Aspect Ratio Controls
- [x] **Output format picker:**
  - [x] Dropdown: MP4 (default), WebM, MOV
  - [x] แสดง codec info (H.264+AAC, VP9+Opus, etc.)
- [x] **Crop / Aspect ratio:**
  - [x] Preset buttons: Original, 16:9, 9:16 (vertical), 1:1, 4:3
  - [x] Visual crop overlay บน video preview (draggable crop box)
  - [x] แสดง output resolution preview
- [x] **Quality setting** (optional):
  - [x] Simple slider: Low / Medium / High / Original
  - [x] แปลงเป็น bitrate settings ภายใน

### D-5: Export Flow
- [x] **Export button:**
  - [x] Validate ว่ามี operation ที่จะทำ (trim range set, clips in queue, etc.)
  - [x] เรียก `EngineRouter` พร้อม operation descriptor
- [x] **Progress UI:**
  - [x] Progress bar แสดง % completion
  - [x] Status text: "กำลังตัด...", "กำลังรวมไฟล์...", "กำลังแปลงรูปแบบ..."
  - [x] Engine indicator: "⚡ WebCodecs" หรือ "🔧 ffmpeg.wasm"
  - [x] ปุ่ม Cancel (abort operation)
- [x] **Result:**
  - [x] แสดง preview ของ output file
  - [x] ปุ่ม Download (trigger browser download)
  - [x] แสดง output file size + processing time
  - [x] ปุ่ม "Edit again" (กลับไปแก้)

---

## Definition of Done
- [x] Trim workflow สมบูรณ์: เลือก range → preview → export → download
- [x] Concat workflow: เพิ่มหลาย clip → reorder → merge → download
- [x] Crop/format change ทำงานได้ครบ
- [x] UI responsive บน mobile + desktop
- [x] Keyboard shortcuts ทำงาน
- [x] Export progress แสดงถูกต้อง, cancel ได้

---

## Notes
- Timeline thumbnails อาจหนักบน mobile — ทำเป็น progressive loading หรือ skip ถ้า low-end
- Snap-to-keyframe UX เป็น key differentiator — ต้องทำให้ชัดเจนว่า fast vs accurate
- ลำดับพัฒนา: D-1 → D-2 → D-5 (ได้ MVP trim flow ก่อน) → D-3 → D-4
