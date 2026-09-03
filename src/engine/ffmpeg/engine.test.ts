import { describe, it, expect } from 'vitest';
import { FFmpegEngine } from './engine';

describe('FFmpegEngine Interface', () => {
  it('exposes all required slow-path operations', () => {
    expect(typeof FFmpegEngine.getInstance).toBe('function');
    expect(typeof FFmpegEngine.frameAccurateTrim).toBe('function');
    expect(typeof FFmpegEngine.crossFormatConcat).toBe('function');
    expect(typeof FFmpegEngine.convertFormat).toBe('function');
    expect(typeof FFmpegEngine.cropVideo).toBe('function');
  });
});
