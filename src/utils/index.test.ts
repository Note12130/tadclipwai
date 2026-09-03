import { describe, it, expect } from 'vitest';
import { formatDuration, formatBytes } from './index';

describe('Format Utilities', () => {
  it('formats duration correctly', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(3665)).toBe('1:01:05');
    expect(formatDuration(-10)).toBe('00:00');
  });

  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024 * 5)).toBe('5 MB');
    expect(formatBytes(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
  });
});
