import { describe, it, expect } from 'vitest';
import { snapToPrecedingKeyframe } from './fastTrim';

describe('Keyframe Snapping Logic', () => {
  it('snaps target time to closest preceding keyframe', () => {
    const keyframes = [
      { timeSeconds: 0 },
      { timeSeconds: 2.0 },
      { timeSeconds: 4.0 },
      { timeSeconds: 6.0 },
    ];

    expect(snapToPrecedingKeyframe(0, keyframes)).toBe(0);
    expect(snapToPrecedingKeyframe(1.5, keyframes)).toBe(0);
    expect(snapToPrecedingKeyframe(2.0, keyframes)).toBe(2.0);
    expect(snapToPrecedingKeyframe(3.9, keyframes)).toBe(2.0);
    expect(snapToPrecedingKeyframe(5.5, keyframes)).toBe(4.0);
    expect(snapToPrecedingKeyframe(10.0, keyframes)).toBe(6.0);
  });

  it('returns target time when no keyframes are found', () => {
    expect(snapToPrecedingKeyframe(5.0, [])).toBe(5.0);
  });
});
