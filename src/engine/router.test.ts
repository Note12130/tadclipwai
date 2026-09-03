import { describe, it, expect } from 'vitest';
import { EngineRouter } from './router';
import type { VideoMetadata } from '../types';

describe('EngineRouter Routing Decisions', () => {
  const mockCompatibleMP4: VideoMetadata = {
    name: 'test.mp4',
    sizeBytes: 10_000_000,
    duration: 60,
    width: 1920,
    height: 1080,
    videoCodec: 'avc1.4d401f',
    audioCodec: 'mp4a.40.2',
    hasAudio: true,
    isWebCodecsFastPathCompatible: true,
    containerType: 'mp4',
  };

  const mockIncompatibleMKV: VideoMetadata = {
    name: 'movie.mkv',
    sizeBytes: 50_000_000,
    duration: 120,
    width: 1920,
    height: 1080,
    hasAudio: true,
    isWebCodecsFastPathCompatible: false,
    containerType: 'mkv',
  };

  it('routes keyframe-aligned trim on compatible MP4 to WebCodecs', () => {
    const decision = EngineRouter.route(
      { type: 'trim', startSeconds: 5, endSeconds: 15, keyframeAligned: true },
      mockCompatibleMP4,
      true
    );
    expect(decision.engine).toBe('webcodecs');
    expect(decision.reason).toContain('Keyframe');
  });

  it('routes frame-accurate trim to ffmpeg.wasm', () => {
    const decision = EngineRouter.route(
      { type: 'trim', startSeconds: 5.234, endSeconds: 15.678, keyframeAligned: false },
      mockCompatibleMP4,
      true
    );
    expect(decision.engine).toBe('ffmpeg');
    expect(decision.reason).toContain('Frame-accurate');
  });

  it('routes same-format concat to WebCodecs', () => {
    const decision = EngineRouter.route(
      { type: 'concat', sameFormat: true },
      mockCompatibleMP4,
      true
    );
    expect(decision.engine).toBe('webcodecs');
  });

  it('routes mismatched concat to ffmpeg.wasm', () => {
    const decision = EngineRouter.route(
      { type: 'concat', sameFormat: false },
      mockCompatibleMP4,
      true
    );
    expect(decision.engine).toBe('ffmpeg');
  });

  it('routes convert, crop, and resize always to ffmpeg.wasm', () => {
    expect(
      EngineRouter.route({ type: 'convert', targetFormat: 'webm' }, mockCompatibleMP4, true).engine
    ).toBe('ffmpeg');

    expect(
      EngineRouter.route({ type: 'crop', x: 0, y: 0, width: 720, height: 720 }, mockCompatibleMP4, true).engine
    ).toBe('ffmpeg');

    expect(
      EngineRouter.route({ type: 'resize', width: 1280, height: 720 }, mockCompatibleMP4, true).engine
    ).toBe('ffmpeg');
  });

  it('falls back to ffmpeg if browser lacks WebCodecs support', () => {
    const decision = EngineRouter.route(
      { type: 'trim', startSeconds: 5, endSeconds: 15, keyframeAligned: true },
      mockCompatibleMP4,
      false // no WebCodecs
    );
    expect(decision.engine).toBe('ffmpeg');
    expect(decision.reason).toContain('ไม่รองรับ WebCodecs');
  });

  it('falls back to ffmpeg if container is incompatible (e.g. MKV)', () => {
    const decision = EngineRouter.route(
      { type: 'trim', startSeconds: 5, endSeconds: 15, keyframeAligned: true },
      mockIncompatibleMKV,
      true
    );
    expect(decision.engine).toBe('ffmpeg');
  });
});
