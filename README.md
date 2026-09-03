# ✂️ ตัดคลิปไว (TadClipWai)

> **เครื่องมือตัดต่อวิดีโอออนไลน์ฟรี ตัดคลิป รวมวิดีโอ ปรับขนาดภาพ ปลอดภัย 100% ประมวลผลในเบราว์เซอร์ของคุณโดยไม่ต้องอัปโหลดไฟล์**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Privacy: Zero-Upload](https://img.shields.io/badge/Privacy-100%25%20Local-emerald.svg)](#-ความปลอดภัยและนโยบายความเป็นส่วนตัว-zero-server-storage)

---

## 🌟 ฟีเจอร์เด่น (Key Features)

- ⚡ **ตัดต่อรวดเร็วระดับมิลลิวินาที (WebCodecs Fast Path):** ตัดต่อและสตรีมก็อปปี้เนื้อหาวิดีโอได้ทันทีโดยไม่ต้องเสียเวลา Re-encode ใหม่
- 🎞️ **ไทม์ไลน์รวมทุกคลิป (Multi-Clip Visual Sequencer):** นำเข้าหลายวิดีโอพร้อมกัน และวางเรียงบนแถบตัดต่อเดียวได้อย่างต่อเนื่อง
- ✂️ **ตัดแต่งคลิปได้โดยตรงบนไทม์ไลน์ (Direct Trimming):** ลากด้ามจับหัว-ท้ายของแต่ละคลิปบนไทม์ไลน์ได้ทันที พร้อมระบบ **Snap to Keyframe ⚡**
- 🎬 **พรีวิวรวมต่อเนื่องตั้งแต่ต้นจนจบ (Seamless Preview):** กดเล่นเพียงครั้งเดียว ตัวเล่นจะเล่นต่อเนื่องข้ามทุกคลิปจนจบโปรเจกต์โดยอัตโนมัติ
- 📱 **ปรับขนาดภาพพร้อมแชร์ลงโซเชียล (Social Presets):**
  - **9:16 แนวตั้ง:** สำหรับ TikTok, Instagram Reels, YouTube Shorts
  - **16:9 แนวนอน:** สำหรับ YouTube, จอทีวี, คอมพิวเตอร์
  - **1:1 สี่เหลี่ยม:** สำหรับโพสต์ Instagram, Facebook
  - **4:3 คลาสสิก:** สำหรับวิดีโอมาตรฐานทั่วไป
- 📦 **เลือกประเภทไฟล์ส่งออกได้:** รองรับการบันทึกเป็นไฟล์ **MP4**, **WebM** และ **MOV**
- 🔒 **ปลอดภัยสูงสุด 100% (Zero-Storage Policy):** วิดีโอทุกไฟล์จะถูกประมวลผลอยู่ภายในเครื่องของคุณเท่านั้น ไม่มีการส่งหรืออัปโหลดไฟล์ขึ้นเซิร์ฟเวอร์ใด ๆ ทั้งสิ้น
- 💾 **รองรับไฟล์ขนาดใหญ่ด้วย OPFS:** จัดการหน่วยความจำผ่าน Origin Private File System พักไฟล์ได้หลายกิกะไบต์โดยไม่กินแรมเครื่อง

---

## 🏗️ สถาปัตยกรรมระบบ (Architecture)

**ตัดคลิปไว** ใช้สถาปัตยกรรม **Hybrid Client-Side Video Processing** ที่ทำงานผ่าน Web Workers แยกจาก UI เกลียวหลัก:

```
                  ┌───────────────────────────────┐
                  │      ผู้ใช้นำเข้าไฟล์วิดีโอ     │
                  └───────────────┬───────────────┘
                                  ▼
                 ┌─────────────────────────────────┐
                 │    OPFS & Metadata Extraction   │
                 └────────────────┬────────────────┘
                                  ▼
                  ┌───────────────────────────────┐
                  │    Smart Engine Auto-Router   │
                  └───────┬───────────────┬───────┘
                          │               │
            (เงื่อนไขตรงกัน)               (ตัดเฟรมละเอียด / ปรับ Crop)
                          ▼               ▼
           ┌──────────────────────┐  ┌──────────────────────┐
           │ WebCodecs Fast Path  │  │  ffmpeg.wasm Engine  │
           │  (Stream Copy ตัดไว)  │  │ (Re-encode หลายแกน)  │
           └──────────┬───────────┘  └──────────┬───────────┘
                      │                         │
                      └───────────┬─────────────┘
                                  ▼
                     ┌────────────────────────┐
                     │ บันทึกวิดีโอลงเครื่องผู้ใช้ │
                     └────────────────────────┘
```

1. **Route A (Fast Path):** ใช้ `WebCodecs API` + `mp4box.js` + `mp4-muxer` ตัดต่อแบบ Stream-Copy ใช้เวลาเพียงไม่กี่วินาที ไม่ลดทอนคุณภาพต้นฉบับ
2. **Route B (Full Engine):** ใช้ `ffmpeg.wasm` (Multi-threaded ด้วย SharedArrayBuffer) รองรับการ Re-encode, Crop สัดส่วน และแปลงรูปแบบไฟล์

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend Core:** React 18, TypeScript, Tailwind CSS, Lucide React
- **Video Processing:** WebCodecs API, MP4Box.js, mp4-muxer, @ffmpeg/ffmpeg (v0.12.x)
- **Local Storage:** Origin Private File System (OPFS) API
- **Build & Tools:** Vite 5, PostCSS, Autoprefixer
- **Testing & QA:** Vitest (Unit Tests), Playwright (E2E Tests), Custom Privacy/Performance Guards

---

## 🚀 วิธีติดตั้งและรันในเครื่อง (Local Development)

### 1. ความต้องการของระบบ (Prerequisites)
- [Node.js](https://nodejs.org/) เวอร์ชั่น 18.0.0 ขึ้นไป
- เว็บเบราว์เซอร์ที่รองรับ WebCodecs เช่น Google Chrome, Microsoft Edge, Brave (เวอร์ชั่นล่าสุด)

### 2. ติดตั้งและเริ่มทำงาน (Installation & Run)
```bash
# โคลนโปรเจกต์
git clone https://github.com/Note12130/tadclipwai.git
cd tadclipwai

# ติดตั้งแพ็กเกจ
npm install

# รัน Development Server
npm run dev
```
เปิดเบราว์เซอร์แล้วไปที่ `http://localhost:5173`

---

## 🧪 การทดสอบและระบบตรวจสอบความปลอดภัย (Tests & Guards)

โปรเจกต์นี้มีระบบตรวจสอบความปลอดภัยและประสิทธิภาพอัตโนมัติ:

```bash
# รัน Unit Tests ทั้งหมด (54 tests)
npm run test

# ตรวจสอบ TypeScript Types
npm run typecheck

# ตรวจสอบนโยบายความปลอดภัย (Zero-Upload Guard ห้ามส่งไฟล์ออกนอกเครื่อง)
npm run check:guard

# ตรวจสอบความเร็วไม่ให้ประสิทธิภาพตก (Performance Regression Guard)
npm run check:perf

# รัน End-to-End Tests ด้วย Playwright
npm run test:e2e

# คอมไพล์สำหรับนำขึ้นใช้งานจริง (Production Build)
npm run build
```

---

## 🌐 การนำขึ้น Host ฟรี (Deployment)

โปรเจกต์นี้เป็น **Static Web Application (100% Client-Side)** สามารถนำขึ้นโฮสต์ฟรีได้ทันที โดยในโค้ดมีไฟล์คอนฟิกรองรับเรียบร้อยแล้ว:

- **Vercel:** รองรับทันทีผ่านไฟล์ `vercel.json` (ตั้งค่า Header `COOP/COEP` สำหรับ Multi-threading)
- **Cloudflare Pages / Netlify:** รองรับทันทีผ่านไฟล์ `public/_headers`

### คำสั่งตั้งค่าสำหรับ Host:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

---

## 🔒 ความปลอดภัยและนโยบายความเป็นส่วนตัว (Zero Server Storage)

1. **ไม่ส่งข้อมูลวิดีโอออกนอกเครื่อง:** ทุกคำสั่งตัดต่อและการแปลงไฟล์เกิดขึ้นใน Web Browser บนเครื่องของผู้ใช้ 100%
2. **ไม่มีการเก็บ Log วิดีโอ:** ทางเราไม่มีเซิร์ฟเวอร์สำหรับรับไฟล์ จึงไม่มีความเสี่ยงเรื่องไฟล์หลุดหรือความเป็นส่วนตัวถูกละเมิด
3. **ระบบ Guard ใน CI:** มีสคริปต์ `scripts/guard-no-upload.js` สแกนโค้ดทุกครั้งก่อน Build หากพบคำสั่งที่พยายามส่งไฟล์วิดีโอผ่านเครือข่าย ระบบจะปฏิเสธการ Build ทันที

---

## 📄 ใบอนุญาต (License)

โปรเจกต์นี้เผยแพร่ภายใต้ใบอนุญาต **[MIT License](LICENSE)** สามารถนำไปใช้งาน พัฒนาต่อ หรือดัดแปลงได้อย่างเสรี
