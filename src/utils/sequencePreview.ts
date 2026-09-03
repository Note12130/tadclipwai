export interface ClipTimeRange {
  id: string;
  startSeconds: number;
  endSeconds: number;
}

export interface ComputedClipRange {
  id: string;
  index: number;
  clipDuration: number;
  projectStart: number;
  projectEnd: number;
  startSeconds: number;
  endSeconds: number;
}

export interface SequenceTimeline {
  ranges: ComputedClipRange[];
  totalDuration: number;
}

/**
 * Computes cumulative project timeline offsets for each trimmed clip in sequence.
 */
export function computeSequenceTimeline(clips: ClipTimeRange[]): SequenceTimeline {
  let accumulated = 0;
  const ranges: ComputedClipRange[] = [];

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const clipDuration = Math.max(0, clip.endSeconds - clip.startSeconds);
    const projectStart = accumulated;
    const projectEnd = accumulated + clipDuration;

    ranges.push({
      id: clip.id,
      index: i,
      clipDuration,
      projectStart,
      projectEnd,
      startSeconds: clip.startSeconds,
      endSeconds: clip.endSeconds,
    });

    accumulated += clipDuration;
  }

  return {
    ranges,
    totalDuration: Math.max(0, accumulated),
  };
}

/**
 * Maps a time on the composite project sequence timeline (0 to totalDuration)
 * to the corresponding clip and its native video playback time.
 */
export function mapProjectTimeToClip(
  projectTime: number,
  timeline: SequenceTimeline
): {
  clipId: string;
  clipIndex: number;
  clipVideoTime: number;
} {
  const { ranges, totalDuration } = timeline;

  if (ranges.length === 0) {
    return { clipId: '', clipIndex: 0, clipVideoTime: 0 };
  }

  const clampedProjectTime = Math.min(totalDuration, Math.max(0, projectTime));

  // Find matching range
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    // If it falls within this clip, or if it is the last clip at the boundary
    if (clampedProjectTime < r.projectEnd || i === ranges.length - 1) {
      const offsetInClip = clampedProjectTime - r.projectStart;
      const clipVideoTime = Math.min(r.endSeconds, r.startSeconds + offsetInClip);
      return {
        clipId: r.id,
        clipIndex: i,
        clipVideoTime,
      };
    }
  }

  const last = ranges[ranges.length - 1];
  return {
    clipId: last.id,
    clipIndex: ranges.length - 1,
    clipVideoTime: last.endSeconds,
  };
}

/**
 * Maps current clip native playback time back to the composite project sequence timeline.
 */
export function mapClipTimeToProjectTime(
  clipId: string,
  clipVideoTime: number,
  timeline: SequenceTimeline
): number {
  const range = timeline.ranges.find(r => r.id === clipId);
  if (!range) return 0;

  const offsetInClip = Math.min(
    range.clipDuration,
    Math.max(0, clipVideoTime - range.startSeconds)
  );

  return range.projectStart + offsetInClip;
}
