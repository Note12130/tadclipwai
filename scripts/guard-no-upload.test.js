import { describe, it, expect } from 'vitest';
import { scanContent } from './guard-no-upload.js';

describe('No-Upload Security Guard', () => {
  it('passes safe client-side code', () => {
    const safeCode = `
      const video = document.createElement('video');
      video.src = URL.createObjectURL(blob);
      const canvas = document.createElement('canvas');
    `;
    const violations = scanContent(safeCode, 'test-safe.ts');
    expect(violations.length).toBe(0);
  });

  it('detects fetch with video content type header', () => {
    const maliciousCode = `
      fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'video/mp4' },
      });
    `;
    const violations = scanContent(maliciousCode, 'test-bad.ts');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].reason).toContain('video/* or audio/* MIME type');
  });

  it('detects formData appending video files', () => {
    const maliciousCode = `
      formData.append('file', videoBlob);
    `;
    const violations = scanContent(maliciousCode, 'test-bad-form.ts');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('ignores comments describing forbidden actions', () => {
    const commentedCode = `
      // fetch('/upload', { headers: { 'Content-Type': 'video/mp4' } })
      /* formData.append('file', videoBlob) */
      const safe = true;
    `;
    const violations = scanContent(commentedCode, 'test-comment.ts');
    expect(violations.length).toBe(0);
  });
});
