export interface BrowserMatrixEntry {
  platform: 'Desktop' | 'Android' | 'iOS';
  browser: string;
  webcodecsSupport: 'Full' | 'Partial' | 'None';
  sharedArrayBufferSupport: boolean;
  opfsSupport: boolean;
  priority: 'P0' | 'P1';
  primaryEngine: 'WebCodecs' | 'ffmpeg.wasm' | 'Hybrid';
  notes: string;
}

export const DEVICE_BROWSER_MATRIX: BrowserMatrixEntry[] = [
  {
    platform: 'Desktop',
    browser: 'Google Chrome / Chromium',
    webcodecsSupport: 'Full',
    sharedArrayBufferSupport: true,
    opfsSupport: true,
    priority: 'P0',
    primaryEngine: 'Hybrid',
    notes: 'รองรับ WebCodecs, SharedArrayBuffer และ OPFS ครบถ้วน ประสิทธิภาพระดับสูงสุด',
  },
  {
    platform: 'Desktop',
    browser: 'Microsoft Edge',
    webcodecsSupport: 'Full',
    sharedArrayBufferSupport: true,
    opfsSupport: true,
    priority: 'P1',
    primaryEngine: 'Hybrid',
    notes: 'ใช้ Chromium engine รองรับฟีเจอร์ครบเหมือน Chrome',
  },
  {
    platform: 'Desktop',
    browser: 'Mozilla Firefox',
    webcodecsSupport: 'Partial',
    sharedArrayBufferSupport: true,
    opfsSupport: true,
    priority: 'P1',
    primaryEngine: 'Hybrid',
    notes: 'รองรับ VideoDecoder บางส่วน, WebCodecs encoder ยังอยู่ระหว่างพัฒนา สลับไปใช้ ffmpeg.wasm ได้สมบูรณ์',
  },
  {
    platform: 'Desktop',
    browser: 'Apple Safari (macOS)',
    webcodecsSupport: 'Partial',
    sharedArrayBufferSupport: true,
    opfsSupport: true,
    priority: 'P1',
    primaryEngine: 'Hybrid',
    notes: 'รองรับ VideoDecoder/VideoEncoder ใน macOS Sonoma 14+ ขึ้นไป มี fallback ไปยัง ffmpeg.wasm',
  },
  {
    platform: 'Android',
    browser: 'Chrome for Android',
    webcodecsSupport: 'Full',
    sharedArrayBufferSupport: true,
    opfsSupport: true,
    priority: 'P0',
    primaryEngine: 'Hybrid',
    notes: 'เป้าหมายหลักบนมือถือ รัน Fast-path trim < 2s บนอุปกรณ์ระดับกลาง (Snapdragon 695 / Tensor G2)',
  },
  {
    platform: 'iOS',
    browser: 'Mobile Safari / WebKit',
    webcodecsSupport: 'Partial',
    sharedArrayBufferSupport: true,
    opfsSupport: true,
    priority: 'P0',
    primaryEngine: 'Hybrid',
    notes: 'iOS 17.4+ รองรับ WebCodecs เบื้องต้น มี ffmpeg.wasm multithread สำรอง',
  },
];

/**
 * Detects current client platform & browser profile against matrix
 */
export function getCurrentPlatformProfile(): {
  platform: 'Desktop' | 'Android' | 'iOS';
  browser: string;
  matchedEntry?: BrowserMatrixEntry;
} {
  if (typeof navigator === 'undefined') {
    return { platform: 'Desktop', browser: 'Node/Test' };
  }

  const ua = navigator.userAgent;
  let platform: 'Desktop' | 'Android' | 'iOS' = 'Desktop';
  let browser = 'Unknown';

  if (/Android/i.test(ua)) {
    platform = 'Android';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    platform = 'iOS';
  }

  if (/Edg/i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) {
    browser = platform === 'Android' ? 'Chrome for Android' : 'Google Chrome';
  } else if (/Firefox/i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = platform === 'iOS' ? 'Mobile Safari' : 'Apple Safari';
  }

  const matchedEntry = DEVICE_BROWSER_MATRIX.find(
    e => e.platform === platform && e.browser.toLowerCase().includes(browser.toLowerCase())
  );

  return {
    platform,
    browser,
    matchedEntry,
  };
}
