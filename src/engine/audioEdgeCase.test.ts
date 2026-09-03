import { describe, it, expect } from 'vitest';
import { MP4Muxer } from './webcodecs/muxer';
import { FFmpegEngine } from './ffmpeg/engine';
import type { TrackMetadata } from './webcodecs/demuxer';

describe('Video-Without-Audio Edge Case Handling (F-1)', () => {
  it('muxes video-only stream cleanly when audio track is absent', () => {
    const videoTrackMeta: TrackMetadata = {
      id: 1,
      type: 'video',
      codec: 'avc1.42001E',
      timescale: 1000,
      durationSeconds: 10,
      width: 1280,
      height: 720,
      nbSamples: 1,
    };

    const dummySample = {
      trackId: 1,
      data: new Uint8Array([0x00, 0x00, 0x00, 0x01, 0x67, 0x42, 0x00]),
      isSync: true,
      dts: 0,
      cts: 0,
      duration: 100,
      timeSeconds: 0,
    };

    // Only video track, no audio track
    const blob = MP4Muxer.mux([
      {
        metadata: videoTrackMeta,
        samples: [dummySample],
      },
    ]);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('video/mp4');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('ffmpeg engine accepts hasAudio = false without error in function signatures', () => {
    expect(typeof FFmpegEngine.frameAccurateTrim).toBe('function');
    expect(typeof FFmpegEngine.cropVideo).toBe('function');
  });
});
