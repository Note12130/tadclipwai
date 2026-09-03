import { describe, it, expect } from 'vitest';
import {
  computeSequenceTimeline,
  mapProjectTimeToClip,
  mapClipTimeToProjectTime,
} from './sequencePreview';

describe('Sequence Preview Realistic Timeline Math', () => {
  // Scenario requested by user:
  // Clip 1: trimmed 0s to 9s (duration 9s)
  // Clip 2: trimmed 0s to 10s (duration 10s)
  // Total sequence duration = 19.0s!
  const clips = [
    { id: 'clip-1', startSeconds: 0, endSeconds: 9 },
    { id: 'clip-2', startSeconds: 0, endSeconds: 10 },
  ];

  it('computes total sequence duration as exactly 19 seconds', () => {
    const timeline = computeSequenceTimeline(clips);
    expect(timeline.totalDuration).toBe(19);
    expect(timeline.ranges[0].clipDuration).toBe(9);
    expect(timeline.ranges[1].clipDuration).toBe(10);
    expect(timeline.ranges[1].projectStart).toBe(9);
  });

  it('maps project time 5s to Clip 1 at 5s', () => {
    const timeline = computeSequenceTimeline(clips);
    const mapped = mapProjectTimeToClip(5, timeline);
    expect(mapped.clipId).toBe('clip-1');
    expect(mapped.clipIndex).toBe(0);
    expect(mapped.clipVideoTime).toBe(5);
  });

  it('maps project time 12s to Clip 2 at 3s', () => {
    const timeline = computeSequenceTimeline(clips);
    const mapped = mapProjectTimeToClip(12, timeline);
    expect(mapped.clipId).toBe('clip-2');
    expect(mapped.clipIndex).toBe(1);
    expect(mapped.clipVideoTime).toBe(3); // 12s - 9s = 3s
  });

  it('maps clip time back to project sequence time accurately', () => {
    const timeline = computeSequenceTimeline(clips);
    // In Clip 2 at 4.5s -> project time = 9s + 4.5s = 13.5s
    const projectTime = mapClipTimeToProjectTime('clip-2', 4.5, timeline);
    expect(projectTime).toBe(13.5);
  });
});
