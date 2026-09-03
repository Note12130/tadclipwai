import { MP4Demuxer } from './demuxer';
import { MP4Muxer, type MuxTrackInput } from './muxer';
import type { ProgressCallback } from '../../types';

/**
 * fastConcat
 * Concatenates multiple matching MP4 buffers via stream copy without re-encoding.
 */
export async function fastConcat(
  buffers: ArrayBuffer[],
  onProgress?: ProgressCallback
): Promise<Blob> {
  if (buffers.length === 0) {
    throw new Error('No input buffers provided for concat');
  }

  if (buffers.length === 1) {
    return new Blob([buffers[0]], { type: 'video/mp4' });
  }

  onProgress?.(15, 'กำลังแยกแยะไฟล์วิดีโอแต่ละคลิป...');

  const demuxedClips = [];
  for (let i = 0; i < buffers.length; i++) {
    const demux = await MP4Demuxer.demux(buffers[i]);
    demuxedClips.push(demux);
    onProgress?.(15 + Math.round((i / buffers.length) * 35), `แยกข้อมูลคลิปที่ ${i + 1}/${buffers.length}...`);
  }

  const baseClip = demuxedClips[0];
  const mergedTracks: MuxTrackInput[] = baseClip.tracks.map(t => ({
    metadata: t,
    samples: [...(baseClip.samplesByTrack.get(t.id) || [])],
  }));

  onProgress?.(60, 'กำลังต่อเรียงและปรับ Timestamp...');

  // Append subsequent clips with timestamp offsets
  let currentVideoOffset = baseClip.durationSeconds;

  for (let c = 1; c < demuxedClips.length; c++) {
    const clip = demuxedClips[c];
    for (const mergedTrack of mergedTracks) {
      const matchTrack = clip.tracks.find(t => t.type === mergedTrack.metadata.type);
      if (!matchTrack) continue;

      const samples = clip.samplesByTrack.get(matchTrack.id) || [];
      const timescale = mergedTrack.metadata.timescale;
      const dtsOffset = Math.round(currentVideoOffset * timescale);

      for (const s of samples) {
        mergedTrack.samples.push({
          ...s,
          dts: s.dts + dtsOffset,
          cts: s.cts + dtsOffset,
          timeSeconds: s.timeSeconds + currentVideoOffset,
        });
      }
    }
    currentVideoOffset += clip.durationSeconds;
  }

  onProgress?.(85, 'กำลังประกอบไฟล์ผลลัพธ์ (Remuxing)...');
  const resultBlob = MP4Muxer.mux(mergedTracks);

  onProgress?.(100, 'รวมไฟล์เสร็จสมบูรณ์');
  return resultBlob;
}
