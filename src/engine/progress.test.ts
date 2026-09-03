import { describe, it, expect, vi } from 'vitest';
import {
  parseFFmpegTimeToSeconds,
  calculateFFmpegProgress,
  ProgressReporter,
} from './progress';

describe('Progress Reporting Abstraction', () => {
  it('parses ffmpeg time strings accurately', () => {
    expect(parseFFmpegTimeToSeconds('frame=  120 fps= 60 q=28.0 size=     512kB time=00:00:04.00 bitrate=1048.6kbits/s')).toBe(4);
    expect(parseFFmpegTimeToSeconds('time=01:02:03.50')).toBe(3723.5);
    expect(parseFFmpegTimeToSeconds('no time string here')).toBeNull();
  });

  it('calculates ffmpeg progress percentage', () => {
    const log = 'frame=  100 time=00:00:30.00 speed=1.5x';
    const percent = calculateFFmpegProgress(log, 60); // 30s of 60s
    expect(percent).toBe(50);
  });

  it('throttles rapid progress updates', () => {
    const callback = vi.fn();
    const reporter = new ProgressReporter(callback, 200);

    reporter.report(10, 'Processing...');
    expect(callback).toHaveBeenCalledWith(10, 'Processing...');

    // Second immediate call with small change should be throttled
    reporter.report(11, 'Processing...');
    expect(callback).toHaveBeenCalledTimes(1);

    // 100% completion should always be reported
    reporter.report(100, 'Done');
    expect(callback).toHaveBeenCalledWith(100, 'Done');
  });
});
