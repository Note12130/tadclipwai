import { describe, it, expect } from 'vitest';
import { isWebCodecsSupported, detectWebCodecsCapabilities } from './capabilities';

describe('WebCodecs Capabilities Detection', () => {
  it('reports support boolean without throwing', () => {
    const supported = isWebCodecsSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('detects capabilities structure properly', async () => {
    const caps = await detectWebCodecsCapabilities();
    expect(caps).toHaveProperty('hasWebCodecs');
    expect(caps).toHaveProperty('hasVideoDecoder');
    expect(caps).toHaveProperty('hasVideoEncoder');
    expect(caps).toHaveProperty('supportedVideoCodecs');
    expect(Array.isArray(caps.supportedVideoCodecs)).toBe(true);
  });
});
