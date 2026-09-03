import type { ValidationResult } from '../types';

export const SUPPORTED_EXTENSIONS = ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v'] as const;

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
export const LARGE_FILE_WARNING_BYTES = 500 * 1024 * 1024; // 500 MB

/**
 * Validates a user-provided video file client-side.
 */
export function validateVideoFile(file: File): ValidationResult {
  const extensionMatch = file.name.split('.').pop()?.toLowerCase();
  const extension = extensionMatch || '';
  const mimeType = file.type || '';

  // 1. Check empty or missing file
  if (!file || file.size === 0) {
    return {
      isValid: false,
      error: 'ไฟล์มีขนาดเป็น 0 หรือไม่พบข้อมูลในไฟล์',
      extension,
      mimeType,
    };
  }

  // 2. Check extension
  const isExtensionSupported = SUPPORTED_EXTENSIONS.includes(
    extension as (typeof SUPPORTED_EXTENSIONS)[number]
  );
  const isMimeVideo = mimeType.startsWith('video/') || mimeType === 'application/mp4';

  if (!isExtensionSupported && !isMimeVideo) {
    return {
      isValid: false,
      error: `ไม่รองรับนามสกุล .${extension || 'unknown'} (รองรับเฉพาะ: ${SUPPORTED_EXTENSIONS.map(e => '.' + e).join(', ')})`,
      extension,
      mimeType,
    };
  }

  // 3. Check max file size limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `ไฟล์มีขนาดใหญ่เกินไป (${(file.size / (1024 * 1024 * 1024)).toFixed(1)} GB) — ขนาดสูงสุดที่รองรับในเบราว์เซอร์คือ 2 GB`,
      extension,
      mimeType,
    };
  }

  // 4. Large file warning (> 500 MB)
  let warning: string | undefined;
  if (file.size > LARGE_FILE_WARNING_BYTES) {
    warning = `ไฟล์มีขนาดค่อนข้างใหญ่ (${(file.size / (1024 * 1024)).toFixed(0)} MB) ระบบจะพักไฟล์ลง OPFS เพื่อป้องกันเบราว์เซอร์หน่วง`;
  }

  return {
    isValid: true,
    warning,
    extension,
    mimeType,
  };
}
