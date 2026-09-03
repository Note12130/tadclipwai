import { describe, it, expect } from 'vitest';
import { EngineRouter } from './router';
import type { MultiTrimConcatOperationDescriptor, VideoMetadata } from '../types';

describe('MultiTrimConcat Engine Routing & Unified Flow', () => {
  const baseMeta: VideoMetadata = {
    name: 'test.mp4',
    sizeBytes: 10_000_000,
    duration: 30,
    width: 1920,
    height: 1080,
    videoCodec: 'avc1.42001E',
    hasAudio: true,
    isWebCodecsFastPathCompatible: true,
    containerType: 'mp4',
  };

  it('routes to webcodecs when keyframeAligned and sameFormat are true', () => {
    const op: MultiTrimConcatOperationDescriptor = {
      type: 'multiTrimConcat',
      clips: [
        { startSeconds: 0, endSeconds: 5 },
        { startSeconds: 10, endSeconds: 15 },
      ],
      keyframeAligned: true,
      sameFormat: true,
    };

    const decision = EngineRouter.route(op, baseMeta, true);
    expect(decision.engine).toBe('webcodecs');
    expect(decision.reason).toContain('Keyframe Stream-Copy');
  });

  it('routes to ffmpeg when keyframeAligned is false (frame-accurate)', () => {
    const op: MultiTrimConcatOperationDescriptor = {
      type: 'multiTrimConcat',
      clips: [
        { startSeconds: 2.34, endSeconds: 7.89 },
        { startSeconds: 10.12, endSeconds: 15.45 },
      ],
      keyframeAligned: false,
      sameFormat: true,
    };

    const decision = EngineRouter.route(op, baseMeta, true);
    expect(decision.engine).toBe('ffmpeg');
  });

  it('routes to ffmpeg when sameFormat is false', () => {
    const op: MultiTrimConcatOperationDescriptor = {
      type: 'multiTrimConcat',
      clips: [
        { startSeconds: 0, endSeconds: 5 },
        { startSeconds: 0, endSeconds: 5 },
      ],
      keyframeAligned: true,
      sameFormat: false,
    };

    const decision = EngineRouter.route(op, baseMeta, true);
    expect(decision.engine).toBe('ffmpeg');
  });
});
