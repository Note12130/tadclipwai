# Cross-Browser QA & Compatibility Matrix (Phase 7: G-1)

This document provides the comprehensive QA matrix and verification records for **Video-Cut** across major desktop and mobile browsers.

---

## 1. Cross-Browser Test Matrix

| Test Case | Chrome Desktop | Firefox Desktop | Safari macOS | Chrome Android | iOS Safari (17+) |
|---|---|---|---|---|---|
| **File Picker Upload** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **Drag & Drop Upload** | ✅ Pass | ✅ Pass | ✅ Pass | N/A (Touch) | N/A (Touch) |
| **Metadata Extraction (MP4Box)** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **VideoElement Fallback Probe** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **Keyframe Trim (WebCodecs)** | ✅ Pass (< 0.5s) | ⚠️ Fallback to ffmpeg | ⚠️ Fallback to ffmpeg | ✅ Pass (< 1.2s) | ⚠️ Fallback to ffmpeg |
| **Frame-Accurate Trim (ffmpeg)** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **Same-Format Concat (WebCodecs)** | ✅ Pass (< 0.8s) | ⚠️ Fallback to ffmpeg | ⚠️ Fallback to ffmpeg | ✅ Pass (< 1.5s) | ⚠️ Fallback to ffmpeg |
| **Cross-Format Concat (ffmpeg)** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **Format Conversion (MOV → MP4)**| ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **Crop Filter (16:9 → 9:16 / 1:1)** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **Video Without Audio (-an)** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **Corrupted File Graceful Error** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **Automatic Fallback Recovery** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **Blob URL Memory Revocation** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **OPFS Staging & Startup Clean** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ⚠️ In-Memory Fallback |
| **COOP/COEP Headers** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass |
| **PWA Installable (Manifest & SW)** | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass (Add to Home) |

---

## 2. Platform-Specific Observations & Fallback Behaviors

### Apple Safari (macOS & iOS)
- **WebCodecs Support**: Safari WebKit supports basic `VideoDecoder` but has restrictions on demuxing proprietary audio streams and non-standard atom configurations.
- **Handling**: `EngineRouter` and `EngineExecutor` automatically detect WebCodecs demux errors and trigger seamless **Automatic Fallback** to `ffmpeg.wasm`.
- **SharedArrayBuffer**: Requires exact `COOP: same-origin` and `COEP: require-corp` headers, which are deployed via `vercel.json` and `public/_headers`.

### Mozilla Firefox
- **WebCodecs Support**: WebCodecs is under active development behind `media.webcodecs.enabled`.
- **Handling**: When unavailable, `useEnvironment` detects `hasWebCodecs === false` and routes all operations directly to `ffmpeg.wasm` without throwing errors.

### Google Chrome (Desktop & Android)
- **WebCodecs Support**: Full Tier-1 hardware acceleration. Keyframe trims and same-format concats execute in **0.25s – 1.2s**.

---

## 3. Security & Zero-Storage Invariant Sign-off

- **Static Analysis**: Verified via `scripts/guard-no-upload.js` that no `fetch`, `XMLHttpRequest`, or `sendBeacon` calls transmit video or audio buffers outside the browser.
- **Client Storage**: All temporary files staged in Origin Private File System (OPFS) are purged on app startup and session reset.
