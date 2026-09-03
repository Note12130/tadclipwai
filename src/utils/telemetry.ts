import type { OperationType, EngineName } from '../types';

export interface TelemetryRecord {
  id: string;
  timestamp: string;
  operationType: OperationType;
  engineUsed: EngineName;
  durationMs: number;
  success: boolean;
  fileSizeBytes?: number;
}

export interface TelemetryStats {
  totalOperations: number;
  fastPathCount: number;
  ffmpegCount: number;
  avgFastPathMs: number;
  avgFFmpegMs: number;
  fastPathRatioPercent: number;
  estimatedTimeSavedSeconds: number;
}

const STORAGE_KEY_OPT_IN = 'video_cut_telemetry_opt_in';
const STORAGE_KEY_RECORDS = 'video_cut_telemetry_records';
const MAX_RECORDS = 200;

/**
 * TelemetryManager
 * 100% Client-Side Privacy-Preserving Telemetry.
 * No network requests are ever made. Stored strictly in local browser storage.
 */
export class TelemetryManager {
  /**
   * Checks whether the user has opted in to local performance telemetry.
   */
  public static isOptedIn(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY_OPT_IN) === 'true';
  }

  /**
   * Updates user opt-in preference.
   */
  public static setOptIn(enabled: boolean): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_OPT_IN, enabled ? 'true' : 'false');
  }

  /**
   * Records an operation result (client-side only, no PII).
   */
  public static recordOperation(
    operationType: OperationType,
    engineUsed: EngineName,
    durationMs: number,
    success: boolean,
    fileSizeBytes?: number
  ): void {
    if (!this.isOptedIn() || typeof localStorage === 'undefined') {
      return;
    }

    const records = this.getRecords();
    const newRecord: TelemetryRecord = {
      id: `tel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      operationType,
      engineUsed,
      durationMs: Math.round(durationMs),
      success,
      fileSizeBytes,
    };

    records.unshift(newRecord);
    if (records.length > MAX_RECORDS) {
      records.pop();
    }

    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch {
      // storage full or blocked
    }
  }

  /**
   * Retrieves all local records.
   */
  public static getRecords(): TelemetryRecord[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Aggregates stats from local records.
   */
  public static getStats(): TelemetryStats {
    const records = this.getRecords().filter(r => r.success);

    const fastPathRecords = records.filter(r => r.engineUsed === 'webcodecs');
    const ffmpegRecords = records.filter(r => r.engineUsed === 'ffmpeg');

    const totalFastMs = fastPathRecords.reduce((sum, r) => sum + r.durationMs, 0);
    const totalFFmpegMs = ffmpegRecords.reduce((sum, r) => sum + r.durationMs, 0);

    const avgFastPathMs = fastPathRecords.length > 0 ? Math.round(totalFastMs / fastPathRecords.length) : 0;
    const avgFFmpegMs = ffmpegRecords.length > 0 ? Math.round(totalFFmpegMs / ffmpegRecords.length) : 0;

    const fastPathCount = fastPathRecords.length;
    const ffmpegCount = ffmpegRecords.length;
    const totalOperations = records.length;

    const fastPathRatioPercent =
      totalOperations > 0 ? Math.round((fastPathCount / totalOperations) * 100) : 0;

    // Estimate time saved = fastPathCount * (avgFFmpegMs - avgFastPathMs)
    const baselineEstimateDiffMs = avgFFmpegMs > avgFastPathMs ? avgFFmpegMs - avgFastPathMs : 8000;
    const estimatedTimeSavedSeconds = Math.round((fastPathCount * baselineEstimateDiffMs) / 1000);

    return {
      totalOperations,
      fastPathCount,
      ffmpegCount,
      avgFastPathMs,
      avgFFmpegMs,
      fastPathRatioPercent,
      estimatedTimeSavedSeconds,
    };
  }

  /**
   * Clears all stored telemetry records.
   */
  public static clearRecords(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_RECORDS);
  }
}
