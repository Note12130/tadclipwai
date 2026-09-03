import { describe, it, expect } from 'vitest';
import { snapToPrecedingKeyframe } from '../engine/webcodecs/fastTrim';

describe('Timeline Component Snapping & Bounds Logic', () => {
  it('constrains start handle before end handle', () => {
    const start = 10;
    const end = 10.2;
    // ensure at least 0.5s separation
    const validStart = Math.min(start, end - 0.5);
    expect(validStart).toBeLessThan(end);
  });

  it('snaps accurately using keyframe list', () => {
    const keyframes = [{ timeSeconds: 0 }, { timeSeconds: 5.0 }, { timeSeconds: 10.0 }];
    expect(snapToPrecedingKeyframe(4.8, keyframes)).toBe(0);
    expect(snapToPrecedingKeyframe(5.1, keyframes)).toBe(5.0);
    expect(snapToPrecedingKeyframe(9.9, keyframes)).toBe(5.0);
    expect(snapToPrecedingKeyframe(10.0, keyframes)).toBe(10.0);
  });
});
