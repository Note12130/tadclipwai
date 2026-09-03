import { describe, it, expect, beforeEach } from 'vitest';
import { BlobRegistry } from './blobRegistry';

describe('BlobRegistry Memory Management (F-3)', () => {
  beforeEach(() => {
    BlobRegistry.revokeAll();
  });

  it('registers and tracks object URLs', () => {
    const blob1 = new Blob(['sample1'], { type: 'video/mp4' });
    const blob2 = new Blob(['sample2'], { type: 'video/mp4' });

    const url1 = BlobRegistry.createUrl(blob1, 'preview');
    expect(BlobRegistry.getActiveCount()).toBe(1);

    // Creating with same tag auto-revokes previous
    const url2 = BlobRegistry.createUrl(blob2, 'preview');
    expect(url1).not.toBe(url2);
    expect(BlobRegistry.getActiveCount()).toBe(1);
  });

  it('revokes individual URL and cleans registry', () => {
    const blob = new Blob(['data'], { type: 'video/mp4' });
    const url = BlobRegistry.createUrl(blob, 'export');
    expect(BlobRegistry.getActiveCount()).toBe(1);

    BlobRegistry.revokeUrl(url);
    expect(BlobRegistry.getActiveCount()).toBe(0);
  });

  it('revokes all URLs on session reset', () => {
    BlobRegistry.createUrl(new Blob(['a']), 'tag1');
    BlobRegistry.createUrl(new Blob(['b']), 'tag2');
    expect(BlobRegistry.getActiveCount()).toBe(2);

    BlobRegistry.revokeAll();
    expect(BlobRegistry.getActiveCount()).toBe(0);
  });
});
