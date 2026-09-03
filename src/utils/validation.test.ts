import { describe, it, expect } from 'vitest';
import { validateVideoFile } from './validation';

describe('Video File Validation', () => {
  it('validates a standard MP4 file successfully', () => {
    const file = new File(['dummy content'], 'video.mp4', { type: 'video/mp4' });
    const result = validateVideoFile(file);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.extension).toBe('mp4');
  });

  it('validates WebM and MOV files successfully', () => {
    const webmFile = new File(['content'], 'sample.webm', { type: 'video/webm' });
    expect(validateVideoFile(webmFile).isValid).toBe(true);

    const movFile = new File(['content'], 'sample.mov', { type: 'video/quicktime' });
    expect(validateVideoFile(movFile).isValid).toBe(true);
  });

  it('rejects unsupported file formats', () => {
    const txtFile = new File(['hello'], 'document.pdf', { type: 'application/pdf' });
    const result = validateVideoFile(txtFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('ไม่รองรับ');
  });

  it('rejects empty 0-byte files', () => {
    const emptyFile = new File([], 'empty.mp4', { type: 'video/mp4' });
    const result = validateVideoFile(emptyFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('0');
  });

  it('warns on files exceeding 500 MB', () => {
    // Mock a large file object
    const largeFile = {
      name: 'large_video.mp4',
      size: 600 * 1024 * 1024, // 600 MB
      type: 'video/mp4',
    } as unknown as File;

    const result = validateVideoFile(largeFile);
    expect(result.isValid).toBe(true);
    expect(result.warning).toContain('ค่อนข้างใหญ่');
  });

  it('rejects files exceeding 2 GB limit', () => {
    const hugeFile = {
      name: 'huge_video.mp4',
      size: 2.5 * 1024 * 1024 * 1024,
      type: 'video/mp4',
    } as unknown as File;

    const result = validateVideoFile(hugeFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('ใหญ่เกินไป');
  });
});
