# Video-Cut Production Launch Checklist (Phase 7: G-4)

This pre-flight checklist must be verified prior to deploying **Video-Cut** to production environments (Vercel, Netlify, Cloudflare Pages).

---

## 1. Automated Quality & Security Gateways

- [x] **Zero-Upload Static Guard**: `npm run check:guard` exits 0 (No unauthorized network egress).
- [x] **TypeScript Typecheck**: `npm run typecheck` exits 0 with zero compile-time errors.
- [x] **Unit & Regression Suite**: `npm run test` passes 100% across all 17 test suites (47 tests).
- [x] **Performance Regression Guard**: `npm run check:perf` confirms fast-path stream copy latency is within baseline tolerance (< 1500ms).
- [x] **Production Build**: `npm run build` generates clean bundles with separate Web Worker assets.

---

## 2. Infrastructure & Hosting Headers

### Target Platforms
- **Vercel**: Configured via [`vercel.json`](file:///Users/pptv/web/video-cut/vercel.json)
- **Netlify / Cloudflare Pages**: Configured via [`public/_headers`](file:///Users/pptv/web/video-cut/public/_headers)

### Mandatory Response Headers
```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
> **Verification Command**:
> ```bash
> curl -sI https://your-production-domain.com | grep -iE "cross-origin"
> ```
> Must return both headers. Without them, `SharedArrayBuffer` will throw and ffmpeg.wasm will fail to initialize.

---

## 3. Post-Deployment Smoke Test (Live URL)

1. **Isolation Check**:
   - Open app on live URL.
   - Inspect top header badge: must display **"COOP/COEP Active"** in green.
2. **Keyframe Trim (Fast Path ⚡)**:
   - Drop a standard 1080p MP4 file.
   - Set trim range and click **"ส่งออกวิดีโอ (Fast)"**.
   - Verify completion in < 2 seconds and download output.
3. **Complex Operation (Slow Path 🔧)**:
   - Select 9:16 aspect ratio preset or Frame-Accurate cut.
   - Confirm ffmpeg.wasm core downloads and initializes smoothly.
   - Verify progress bar advances to 100% and output is downloadable.
4. **PWA Offline Launch**:
   - Open in Chrome Android or Desktop Chrome.
   - Verify "Install app" icon appears in URL bar.
   - Launch in airplane/offline mode to verify static app shell loads.
