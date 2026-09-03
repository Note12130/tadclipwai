# Phase 5 — Performance Benchmarking (Epic E)

> **Goal:** วัดผลและพิสูจน์ว่า WebCodecs fast path เร็วกว่า ffmpeg.wasm จริง — นี่คือ key differentiator ของ product
> **Depends on:** Phase 3 (ต้องมี engine ทั้ง 2 ตัว)

---

## Tasks

### E-1: Internal Benchmark Harness
- [x] สร้าง `BenchmarkRunner` module:
  - รับ test video file + operation → run บนทั้ง 2 engines
  - วัด timing: start → end (wall clock + performance.now())
  - วัด memory usage (performance.memory ถ้ามี)
  - เก็บ result เป็น structured data
- [x] ชุด benchmark operations:
  - Trim 10s clip จากวิดีโอ 1 นาที (keyframe-aligned)
  - Trim 10s clip (frame-accurate, non-keyframe)
  - Concat 2 clips (same format)
  - Concat 2 clips (different format)
  - Format conversion (MOV → MP4)
- [x] Test video files:
  - Small: 720p, 30fps, 1 min, ~20MB
  - Medium: 1080p, 30fps, 5 min, ~150MB
  - Large: 1080p, 60fps, 10 min, ~500MB
- [x] Output: benchmark report (JSON + human-readable summary)

### E-2: Device/Browser Capability Matrix
- [x] ทดสอบบน matrix:

  | Platform | Browser | WebCodecs Support | Priority |
  |----------|---------|-------------------|----------|
  | Desktop | Chrome | ✅ Full | P0 |
  | Desktop | Edge | ✅ Full | P1 |
  | Desktop | Firefox | ⚠️ Partial | P1 |
  | Desktop | Safari | ⚠️ Partial | P1 |
  | Android | Chrome | ✅ Full | P0 |
  | iOS | Safari | ⚠️ Partial | P0 |

- [x] Document ว่า operation ไหนใช้ engine ไหนบน browser ไหน
- [x] Identify gaps ที่ต้อง fallback

### E-3: Client-Side Engine Telemetry (Opt-in)
- [x] สร้าง lightweight telemetry module:
  - เก็บ: operation type, engine used, duration, success/failure
  - **ไม่เก็บ**: file name, content, PII ใด ๆ
  - Opt-in only (ถามก่อน, default = off)
- [x] Aggregate client-side (ไม่ส่ง raw data ไป server)
- [x] แสดง stats ใน dev console / debug panel

### E-4: Benchmark Documentation
- [x] สร้าง benchmark results document:
  - เปรียบเทียบ WebCodecs vs ffmpeg.wasm สำหรับแต่ละ operation
  - Target: keyframe-aligned trim/concat **< 2 seconds** บน mid-range Android
  - กราฟ / ตาราง แสดงผลชัดเจน
- [x] นิยาม "mid-range device" ที่ใช้ benchmark:
  - เสนอ: Samsung Galaxy A54 / Pixel 7a / เทียบเท่า
  - CPU: Snapdragon 695 / Tensor G2 ระดับ
  - RAM: 6-8GB
- [x] Publish ผลเป็น public page (ใช้เป็น marketing differentiator)

---

## Definition of Done
- [x] Benchmark harness รันได้ ผล reproducible
- [x] มี benchmark results สำหรับ Chrome desktop + Android Chrome อย่างน้อย
- [x] พิสูจน์ได้ว่า WebCodecs fast path เร็วกว่า ffmpeg.wasm สำหรับ supported operations
- [x] Document ผลเป็น readable report

---

## Notes
- Benchmark ควรรัน automated ใน CI ด้วย — เพื่อ detect performance regression (Phase 7 G-3)
- ผล benchmark อาจนำไปใช้เป็น content marketing ได้ (blog post, landing page comparison)
- "Mid-range device" definition ต้อง align กับ product team / stakeholder
