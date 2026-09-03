import { useState, useEffect } from 'react';

export interface DevicePerformanceProfile {
  isLowEnd: boolean;
  cores: number;
  memoryGb?: number;
  reasons: string[];
}

export function detectDevicePerformance(): DevicePerformanceProfile {
  if (typeof navigator === 'undefined') {
    return { isLowEnd: false, cores: 8, reasons: [] };
  }

  const cores = navigator.hardwareConcurrency || 4;
  const memoryGb = (navigator as any).deviceMemory; // Available in Chromium
  const reasons: string[] = [];

  if (cores < 4) {
    reasons.push(`จำนวน CPU Cores ต่ำ (${cores} cores)`);
  }

  if (memoryGb && memoryGb < 4) {
    reasons.push(`RAM ของอุปกรณ์น้อย (~${memoryGb} GB)`);
  }

  return {
    isLowEnd: reasons.length > 0,
    cores,
    memoryGb,
    reasons,
  };
}

export function useDevicePerformance(): DevicePerformanceProfile {
  const [profile, setProfile] = useState<DevicePerformanceProfile>(() =>
    detectDevicePerformance()
  );

  useEffect(() => {
    setProfile(detectDevicePerformance());
  }, []);

  return profile;
}

/**
 * Checks if a warning should be presented before running a slow/heavy operation.
 */
export function shouldWarnBeforeSlowOperation(
  fileSizeBytes: number,
  engine: 'webcodecs' | 'ffmpeg',
  profile: DevicePerformanceProfile
): boolean {
  // WebCodecs fast path does not stress the CPU, no warning needed
  if (engine === 'webcodecs') return false;

  const isLargeFile = fileSizeBytes > 200 * 1024 * 1024; // > 200MB

  // Warn if low-end device OR file is larger than 200MB on ffmpeg slow path
  return profile.isLowEnd || isLargeFile;
}
