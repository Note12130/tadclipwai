import { describe, it, expect } from 'vitest';
import { BenchmarkRunner, type BenchmarkReport } from './runner';

describe('BenchmarkRunner Calculations & Report Generation', () => {
  it('generates a clean markdown table from comparisons', () => {
    const mockReport: BenchmarkReport = {
      deviceInfo: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        hardwareConcurrency: 8,
        deviceMemoryGb: 8,
      },
      comparisons: [
        {
          operationName: 'Keyframe Trim (10s)',
          webcodecs: {
            engine: 'webcodecs',
            durationMs: 250,
            outputSizeBytes: 5_000_000,
            success: true,
          },
          ffmpeg: {
            engine: 'ffmpeg',
            durationMs: 4000,
            outputSizeBytes: 4_800_000,
            success: true,
          },
          speedupFactor: 16.0,
          timeSavedMs: 3750,
          recommendedEngine: 'webcodecs',
          timestamp: '2026-09-03T12:00:00Z',
        },
      ],
      generatedAt: '2026-09-03T12:00:00Z',
    };

    const markdown = BenchmarkRunner.generateMarkdownReport(mockReport);
    expect(markdown).toContain('Video-Cut Benchmark Report');
    expect(markdown).toContain('Keyframe Trim (10s)');
    expect(markdown).toContain('16x เร็วกว่า');
    expect(markdown).toContain('WebCodecs ⚡');
  });
});
