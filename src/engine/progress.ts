import type { ProgressCallback } from '../types';

/**
 * Parses time format from ffmpeg stdout (e.g. "time=00:01:23.45") into total seconds.
 */
export function parseFFmpegTimeToSeconds(logLine: string): number | null {
  const match = logLine.match(/time=(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);
  if (!match) return null;

  const hours = parseFloat(match[1]);
  const minutes = parseFloat(match[2]);
  const seconds = parseFloat(match[3]);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Extracts percentage from ffmpeg log when total duration is known.
 */
export function calculateFFmpegProgress(logLine: string, totalDurationSeconds: number): number | null {
  if (totalDurationSeconds <= 0) return null;

  const currentSeconds = parseFFmpegTimeToSeconds(logLine);
  if (currentSeconds === null) return null;

  const percent = Math.min(100, Math.max(0, (currentSeconds / totalDurationSeconds) * 100));
  return Math.round(percent);
}

/**
 * Unified progress reporter with throttling to prevent UI rerender spam.
 */
export class ProgressReporter {
  private lastReportedTime = 0;
  private lastPercent = -1;
  private callback?: ProgressCallback;
  private throttleMs: number;

  constructor(callback?: ProgressCallback, throttleMs = 100) {
    this.callback = callback;
    this.throttleMs = throttleMs;
  }

  public report(percent: number, status: string, force = false): void {
    if (!this.callback) return;

    const now = Date.now();
    const clampedPercent = Math.min(100, Math.max(0, Math.round(percent)));

    if (
      force ||
      clampedPercent === 100 ||
      (now - this.lastReportedTime >= this.throttleMs && clampedPercent !== this.lastPercent)
    ) {
      this.lastReportedTime = now;
      this.lastPercent = clampedPercent;
      this.callback(clampedPercent, status);
    }
  }

  public reset(): void {
    this.lastReportedTime = 0;
    this.lastPercent = -1;
  }
}
