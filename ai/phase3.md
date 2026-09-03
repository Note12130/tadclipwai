# Phase 3 — Processing Engine Layer (Epic C) ⭐ Core

> **Goal:** สร้าง hybrid processing engine — WebCodecs fast path + ffmpeg.wasm slow path พร้อม auto-fallback
> **Depends on:** Phase 2 (ต้องมีไฟล์ + metadata ให้ process)
> **นี่คือ core ของทั้งโปรเจกต์ — ใช้เวลามากที่สุด**

---

## Tasks

### Group 3A — Engine Infrastructure

#### C-1: EngineRouter Module
- [x] สร้าง `EngineRouter` ที่รับ operation descriptor แล้ว return engine ที่เหมาะสม:

  | Operation | Engine | เหตุผล |
  |-----------|--------|--------|
  | Trim (keyframe-aligned) | WebCodecs | Stream copy, ไม่ต้อง re-encode |
  | Trim (frame-accurate) | ffmpeg.wasm | ต้อง re-encode จาก arbitrary frame |
  | Concat (same codec/res/fps) | WebCodecs | Stream copy ได้ |
  | Concat (mismatched) | ffmpeg.wasm | ต้อง normalize format |
  | Format conversion | ffmpeg.wasm | Container/codec conversion |
  | Crop / aspect ratio | ffmpeg.wasm | Pixel-level filtering |
  | Resolution/bitrate change | ffmpeg.wasm | Filter graph needed |

- [x] สร้าง TypeScript types:
  ```typescript
  type OperationType = 'trim' | 'concat' | 'convert' | 'crop' | 'resize';
  type EngineName = 'webcodecs' | 'ffmpeg';
  interface OperationDescriptor { type: OperationType; /* ... */ }
  interface EngineResult { blob: Blob; duration: number; engine: EngineName; }
  ```

#### C-2: WebCodecs Capability Detection
- [x] Feature detect ตอน app load:
  - `'VideoDecoder' in window`
  - `'VideoEncoder' in window`
  - `'AudioDecoder' in window`
  - `'AudioEncoder' in window`
  - `VideoEncoder.isConfigSupported()` สำหรับ codec ที่ต้องการ
- [x] เก็บ result ใน global state / context
- [x] ถ้า WebCodecs ไม่พร้อม → EngineRouter route ทุกอย่างไป ffmpeg.wasm
- [x] แสดง badge บน UI บอก engine mode

#### C-3: Web Worker Isolation
- [x] สร้าง `ProcessingWorker` — run ทั้ง 2 engines off main thread
- [x] Main thread ↔ Worker communication ผ่าน `postMessage` / `MessageChannel`
- [x] Transferable objects: ส่ง `ArrayBuffer` แบบ transfer (ไม่ copy)
- [x] สร้าง typed message protocol:
  ```typescript
  type WorkerMessage =
    | { type: 'start'; operation: OperationDescriptor; data: ArrayBuffer }
    | { type: 'progress'; percent: number }
    | { type: 'done'; result: ArrayBuffer }
    | { type: 'error'; message: string; canRetry: boolean }
  ```

#### C-4: Progress Reporting Abstraction
- [x] สร้าง unified `ProgressReporter` interface ที่ทั้ง 2 engines implement
- [x] WebCodecs: report progress ตาม frames processed / total frames
- [x] ffmpeg.wasm: parse progress จาก ffmpeg log output
- [x] Emit events ไปยัง UI: `onProgress(percent)`, `onStatusChange(status)`

#### C-5: Automatic Fallback
- [x] ถ้า WebCodecs operation fail (unsupported codec, corrupt frame, runtime error):
  1. Log failure reason (client-side only)
  2. Retry operation ผ่าน ffmpeg.wasm อัตโนมัติ
  3. แจ้ง user ว่ากำลัง fallback ("ใช้ตัวเลือกสำรอง อาจใช้เวลาเพิ่ม")
- [x] Max retry = 1 (WebCodecs → ffmpeg.wasm, ไม่ retry ffmpeg.wasm ซ้ำ)
- [x] ถ้า ffmpeg.wasm ก็ fail → แสดง error ชัดเจน

---

### Group 3B — WebCodecs Fast Path

#### C-6: Container Demux (mp4box.js)
- [x] ใช้ `mp4box.js` อ่าน MP4 container:
  - Parse moov/mdat atoms
  - สร้าง sample table (keyframes, timestamps, byte offsets)
- [x] สร้าง `MP4Demuxer` class ที่ expose:
  - `getKeyframes(): KeyframeInfo[]`
  - `getSamples(start, end): Sample[]`
  - `getTrackInfo(): TrackInfo[]`

#### C-7: Keyframe-Aligned Trim (Stream Copy)
- [x] รับ start/end time → snap ไป nearest keyframe
- [x] Copy samples ใน range โดยไม่ decode/encode
- [x] Handle ทั้ง video + audio track (sync timestamps)
- [x] คาดหวัง: **เสร็จใน < 2 วินาที** บน mid-range device

#### C-8: Same-Format Concat (Stream Copy)
- [x] ตรวจว่า clips มี same codec, resolution, fps
- [x] Concat โดย append samples, recalculate timestamps
- [x] Handle audio track alignment ระหว่าง clips

#### C-9: Remux to Valid MP4
- [x] สร้าง `MP4Muxer` — remux samples กลับเป็น valid MP4 file
- [x] Generate proper moov atom (metadata, sample table, etc.)
- [x] Output เป็น `Blob` ที่เล่นได้ใน browser `<video>` element
- [x] Validate output: เปิดเล่นได้, duration ถูกต้อง

---

### Group 3C — ffmpeg.wasm Slow Path

#### C-10: ffmpeg.wasm Wrapper
- [x] สร้าง `FFmpegEngine` singleton:
  - Load ffmpeg.wasm core ครั้งเดียว (lazy init)
  - ไม่ re-download core ทุกครั้ง (cache ใน memory)
  - Handle `SharedArrayBuffer` requirement (ต้องมี COOP/COEP)
- [x] Write input file ไป ffmpeg virtual FS → run command → read output
- [x] Parse ffmpeg log เพื่อ extract progress %

#### C-11: Frame-Accurate Trim
- [x] ffmpeg command: `-ss <start> -to <end> -i input.mp4 -c:v libx264 -c:a aac output.mp4`
- [x] ใช้ input seeking (`-ss` before `-i`) เพื่อความเร็ว
- [x] Handle audio sync

#### C-12: Cross-Format Concat
- [x] Normalize ทุก clip ให้ same format ก่อน concat
- [x] ใช้ ffmpeg concat demuxer หรือ filter_complex
- [x] Re-encode ด้วย settings ที่เหมาะสม

#### C-13: Format Conversion
- [x] MOV → MP4, WebM → MP4, etc.
- [x] ให้ user เลือก output format
- [x] Default codec settings ที่สมเหตุสมผล (H.264 + AAC for MP4)

#### C-14: Crop / Aspect Ratio Change
- [x] ffmpeg crop filter: `-vf "crop=w:h:x:y"`
- [x] Preset aspect ratios: 16:9, 9:16, 1:1, 4:3
- [x] Visual preview ก่อน process (Phase 4)

---

## Definition of Done
- [x] Keyframe-aligned trim ทำงานผ่าน WebCodecs ได้จริง (ไม่ re-encode)
- [x] ffmpeg.wasm trim/concat/convert/crop ทำงานได้
- [x] Auto-fallback: WebCodecs fail → ffmpeg.wasm retry สำเร็จ
- [x] ทุก operation รันใน Web Worker (main thread ไม่กระตุก)
- [x] Progress bar update realtime สำหรับทุก operation
- [x] Unit tests สำหรับ EngineRouter logic + capability detection

---

## Notes
- Phase นี้ใหญ่ที่สุด — อาจแบ่งทำเป็น 3 รอบ: Infrastructure → WebCodecs → ffmpeg.wasm
- `mp4box.js` documentation ค่อนข้างน้อย — อาจต้อง reference ตัวอย่างจาก WebCodecs samples ของ W3C
- ระวัง memory leak จาก `VideoFrame` — ต้อง `.close()` ทุกครั้ง
