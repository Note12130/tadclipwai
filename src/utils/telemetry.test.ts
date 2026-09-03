import { describe, it, expect, beforeEach } from 'vitest';
import { TelemetryManager } from './telemetry';

describe('TelemetryManager Client-Side Privacy Compliance', () => {
  beforeEach(() => {
    TelemetryManager.clearRecords();
    TelemetryManager.setOptIn(false);
  });

  it('respects opt-in policy and does not record when disabled', () => {
    expect(TelemetryManager.isOptedIn()).toBe(false);

    TelemetryManager.recordOperation('trim', 'webcodecs', 350, true, 10_000_000);
    const records = TelemetryManager.getRecords();
    expect(records.length).toBe(0);
  });

  it('records operations and computes stats accurately when opt-in is enabled', () => {
    TelemetryManager.setOptIn(true);
    expect(TelemetryManager.isOptedIn()).toBe(true);

    TelemetryManager.recordOperation('trim', 'webcodecs', 300, true);
    TelemetryManager.recordOperation('trim', 'webcodecs', 500, true);
    TelemetryManager.recordOperation('convert', 'ffmpeg', 4000, true);

    const stats = TelemetryManager.getStats();
    expect(stats.totalOperations).toBe(3);
    expect(stats.fastPathCount).toBe(2);
    expect(stats.ffmpegCount).toBe(1);
    expect(stats.avgFastPathMs).toBe(400);
    expect(stats.avgFFmpegMs).toBe(4000);
    expect(stats.fastPathRatioPercent).toBe(67);
  });

  it('clears records completely', () => {
    TelemetryManager.setOptIn(true);
    TelemetryManager.recordOperation('trim', 'webcodecs', 200, true);
    expect(TelemetryManager.getRecords().length).toBe(1);

    TelemetryManager.clearRecords();
    expect(TelemetryManager.getRecords().length).toBe(0);
  });
});
