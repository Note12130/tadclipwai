# Requirements: Browser-Based Video Editor (Hybrid WebCodecs + ffmpeg.wasm)

## 1. Project Overview

**Goal:** Build a client-side (zero-storage-cost) web video editor similar in spirit to
2minclip.com, but faster on mobile/low-end devices by using a **hybrid processing
engine**: native **WebCodecs API** for operations that don't require re-encoding
(fast path), falling back to **ffmpeg.wasm** for operations that require complex
filters (slow but capable path).

**Core principle:** All video processing happens in the user's browser. The server
never stores or processes user video files — server only hosts static assets
(HTML/JS/CSS/WASM binaries). No database of user media, no object storage, no
video upload endpoint.

**Success criteria:**
- Trim/cut/concat operations on H.264/MP4 complete in near real-time on mid-range
  mobile devices (vs. 10-30s+ with ffmpeg.wasm alone).
- App remains fully functional with zero backend video processing cost.
- Feature parity with 2minclip.com baseline (trim, cut, merge, convert, crop) plus
  the performance advantage as the key differentiator.

**Out of scope (v1):**
- User accounts / cloud project sync
- Multi-track timeline editor with transitions/effects
- AI features (captions, auto-highlight)
- Server-side rendering fallback

---

## 2. Architecture Decisions

### 2.1 Processing Engine Router
A decision layer must inspect the requested operation and route to the fastest
capable engine:

| Operation | Engine | Why |
|---|---|---|
| Trim (keyframe-aligned cut) | WebCodecs (demux/remux, no re-encode) | No decode/encode needed — just container-level cut |
| Trim (frame-accurate, non-keyframe) | ffmpeg.wasm | Requires re-encoding from arbitrary frame |
| Concat (same codec/resolution/fps) | WebCodecs (stream copy) or ffmpeg.wasm `-c copy` | Avoid re-encode when formats match |
| Concat (mismatched formats) | ffmpeg.wasm (re-encode) | Needs format normalization |
| Format conversion (e.g. MOV → MP4) | ffmpeg.wasm | Container/codec conversion, WebCodecs alone can't mux all containers |
| Crop / aspect ratio change | ffmpeg.wasm (or WebCodecs decode + Canvas + re-encode, evaluate both) | Needs pixel-level filtering |
| Resolution/bitrate change | ffmpeg.wasm | Filter graph needed |

### 2.2 Fallback Rules
- Detect WebCodecs browser support at load time (`'VideoEncoder' in window`, etc.).
- If unsupported → route everything to ffmpeg.wasm silently, no broken UX.
- If a WebCodecs path fails at runtime (unsupported codec, corrupt input) → retry
  via ffmpeg.wasm automatically, log the failure reason for telemetry (client-side
  only, no PII, opt-in).

### 2.3 No-Storage Guarantee
- No video/audio bytes ever sent via `fetch`/`XHR` to any first-party endpoint.
- File handling stays in-memory (`ArrayBuffer`/`Blob`) or `OPFS` (Origin Private
  File System) for large-file staging — never `localStorage`/`sessionStorage`
  (not viable for binary size anyway).
- CI/lint rule: fail build if any network call includes a `video/*` or `audio/*`
  mime-typed body to a non-CDN origin.

---

## 3. Tech Stack (proposed — Antigravity may confirm/adjust during planning)

- **Frontend framework:** React + TypeScript + Vite
- **Fast path:** WebCodecs API (`VideoDecoder`, `VideoEncoder`, `AudioDecoder`,
  `AudioEncoder`) + a muxer/demuxer library (e.g. `mp4box.js` for MP4 container
  parsing, since WebCodecs itself does not mux/demux containers)
- **Slow path:** `@ffmpeg/ffmpeg` + `@ffmpeg/core` (ffmpeg.wasm)
- **UI state/timeline preview:** Canvas API for scrubber/preview rendering
- **Large file staging:** OPFS (Origin Private File System) via
  `navigator.storage.getDirectory()`
- **Hosting:** Static hosting (Vercel/Netlify/Cloudflare Pages) with required
  `Cross-Origin-Opener-Policy: same-origin` and
  `Cross-Origin-Embedder-Policy: require-corp` headers (needed for
  `SharedArrayBuffer`, used by ffmpeg.wasm multithreading)
- **Testing:** Playwright for browser E2E (including actual file upload/export
  flow), Vitest for unit tests

---

## 4. Feature Breakdown (Epics → Tasks)

### Epic A — Project Scaffolding & Infra
- [ ] Init Vite + React + TypeScript project
- [ ] Configure COOP/COEP headers on dev server and production hosting config
- [ ] Set up CI pipeline (lint, typecheck, unit tests, Playwright E2E)
- [ ] Add the "no video upload to server" lint/CI guard described in 2.3
- [ ] Basic responsive app shell (mobile-first layout)

### Epic B — File Ingestion
- [ ] Drag-and-drop + file picker for video upload (client-side only)
- [ ] Validate file type/size client-side, show clear error states
- [ ] Stage large files into OPFS instead of holding entire file in JS memory
- [ ] Extract basic metadata (duration, resolution, codec, fps, has-audio-track)
  using `mp4box.js` or WebCodecs container probing

### Epic C — Processing Engine Layer (the core of this project)
- [ ] `EngineRouter` module: takes an operation descriptor, returns which engine
  to use per the table in 2.1
- [ ] WebCodecs capability detection module (feature-detect on load)
- [ ] WebCodecs fast-path implementation:
  - [ ] Container demux (mp4box.js) to locate keyframes/sample table
  - [ ] Keyframe-aligned trim via stream copy (no decode/encode)
  - [ ] Same-format concat via stream copy
  - [ ] Remux back into valid MP4 container
- [ ] ffmpeg.wasm slow-path implementation:
  - [ ] Wrap ffmpeg.wasm load/init (singleton, avoid re-downloading core)
  - [ ] Frame-accurate trim
  - [ ] Cross-format concat (re-encode)
  - [ ] Format conversion
  - [ ] Crop / aspect ratio change
- [ ] Automatic fallback: WebCodecs failure → retry on ffmpeg.wasm
- [ ] Progress reporting abstraction (both engines report % progress to same UI)
- [ ] Web Worker isolation: run both engines off the main thread to keep UI
  responsive

### Epic D — Editing UI
- [ ] Video preview player (native `<video>` element bound to Blob URL)
- [ ] Trim handles on a scrubber/timeline (Canvas or DOM-based)
- [ ] Multi-clip queue UI for concat/merge workflows
- [ ] Format/crop/aspect-ratio selection controls
- [ ] Export button → triggers EngineRouter → shows progress → download result

### Epic E — Performance Benchmarking (this is the product's key differentiator, treat as first-class)
- [ ] Internal benchmark harness: run same operation on both engines, log timing
- [ ] Device/browser capability matrix testing (desktop Chrome/Firefox/Safari,
  Android Chrome, iOS Safari)
- [ ] Automatic engine-choice telemetry (client-side aggregate only, opt-in) to
  validate real-world speed gains post-launch
- [ ] Document benchmark results (target: X% faster than ffmpeg.wasm-only
  baseline on defined operation set)

### Epic F — Polish & Edge Cases
- [ ] Handle video-with-no-audio-track edge case (known ffmpeg.wasm pitfall)
- [ ] Handle corrupted/unsupported input files gracefully
- [ ] Memory management: release Blob URLs, clear OPFS temp files after export
- [ ] Low-end device warning (e.g. large file + old mobile browser) before
  starting a slow-path operation
- [ ] Offline-capable shell (basic PWA manifest + service worker for app assets,
  not required for v1 functionality but sets up future offline feature)

### Epic G — QA & Launch
- [ ] Cross-browser manual QA pass (esp. Safari WebCodecs support gaps)
- [ ] Playwright E2E: upload → trim → export → verify output file playable
- [ ] Performance regression test in CI (fails build if fast-path benchmark
  regresses beyond threshold)
- [ ] Deploy to production static hosting with correct headers verified

---

## 5. Non-Functional Requirements

- **Privacy:** No video/audio data leaves the user's device. State this
  explicitly in-app.
- **Performance target:** Keyframe-aligned trim/concat under 2 seconds on a
  mid-range Android phone (definition of "mid-range" to be pinned during
  benchmarking in Epic E).
- **Browser support:** Full hybrid experience on Chrome/Edge (desktop + Android).
  Graceful ffmpeg.wasm-only fallback on Safari/iOS where WebCodecs support is
  partial.
- **Cost:** Zero recurring backend compute/storage cost for core editing
  features. Only cost is static hosting + CDN bandwidth for app assets.

---

## 6. Open Questions for Antigravity to Flag During Planning

- Best MP4 demux/remux library choice (`mp4box.js` vs. alternatives) given
  WebCodecs doesn't handle containers itself.
- Whether OPFS support is broad enough to rely on, or needs an in-memory
  fallback for unsupported browsers.
- Exact set of "mid-range device" benchmark targets to define done-ness for
  Epic E.
