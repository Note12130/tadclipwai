import { MP4Demuxer } from './demuxer';
import { MP4Muxer, type MuxTrackInput } from './muxer';
import type { ProgressCallback } from '../../types';

/**
 * Snaps a target time to the nearest keyframe at or prior to target time.
 */
export function snapToPrecedingKeyframe(
  targetTimeSeconds: number,
  keyframes: { timeSeconds: number }[]
): number {
  if (keyframes.length === 0) return targetTimeSeconds;

  let best = keyframes[0].timeSeconds;
  for (const kf of keyframes) {
    if (kf.timeSeconds <= targetTimeSeconds) {
      best = kf.timeSeconds;
    } else {
      break;
    }
  }

  return best;
}

/**
 * fastKeyframeTrim
 * Keyframe-aligned stream copy trim (no decode/encode).
 * Executes in near real-time (< 2 seconds) on mid-range devices.
 */
export async function fastKeyframeTrim(
  buffer: ArrayBuffer,
  startSeconds: number,
  endSeconds: number,
  onProgress?: ProgressCallback
): Promise<Blob> {
  onProgress?.(10, 'กำลังแยกแยะโครงสร้าง Container (Demuxing)...');

  const demuxResult = await MP4Demuxer.demux(buffer);
  onProgress?.(40, 'กำลังค้นหา Keyframe และตัดช่วงข้อมูล...');

  const videoTrack = demuxResult.tracks.find(t => t.type === 'video');
  const actualStart = videoTrack
    ? snapToPrecedingKeyframe(startSeconds, demuxResult.keyframes)
    : startSeconds;

  const muxInputs: MuxTrackInput[] = [];

  for (const track of demuxResult.tracks) {
    const allSamples = demuxResult.samplesByTrack.get(track.id) || [];
    // Filter samples in the [actualStart, endSeconds] window
    const selectedSamples = allSamples.filter(
      s => s.timeSeconds >= actualStart && s.timeSeconds <= endSeconds
    );

    muxInputs.push({
      metadata: track,
      samples: selectedSamples,
    });
  }

  onProgress?.(70, 'กำลังประกอบไฟล์กลับเป็น MP4 (Remuxing)...');
  const resultBlob = MP4Muxer.mux(muxInputs);

  onProgress?.(100, 'ตัดต่อเสร็จสมบูรณ์');
  return resultBlob;
}
