import { describe, it, expect } from 'vitest';
import { isFastPathCodec, extractVideoMetadata } from './metadata';

describe('Video Metadata Extraction', () => {
  it('identifies fast path codecs correctly', () => {
    expect(isFastPathCodec('avc1.4d401f')).toBe(true);
    expect(isFastPathCodec('hvc1.1.6.L93.B0')).toBe(true);
    expect(isFastPathCodec('hev1.1.6.L93.B0')).toBe(true);
    expect(isFastPathCodec('vp09.00.10.08')).toBe(true);
    expect(isFastPathCodec('av01.0.04M.08')).toBe(true);
    expect(isFastPathCodec('theora')).toBe(false);
    expect(isFastPathCodec('mpeg4')).toBe(false);
    expect(isFastPathCodec(undefined)).toBe(false);
  });

  it('extracts fallback metadata from File object', async () => {
    const fakeFile = new File(['dummy binary data'], 'sample_clip.mp4', {
      type: 'video/mp4',
    });

    const metadata = await extractVideoMetadata(fakeFile, 50);
    expect(metadata.name).toBe('sample_clip.mp4');
    expect(metadata.sizeBytes).toBe(fakeFile.size);
    expect(metadata.containerType).toBe('mp4');
  });

  it('correctly sets containerType for webm and mkv', async () => {
    const webmFile = new File(['fake webm'], 'movie.webm', { type: 'video/webm' });
    const metadataWebm = await extractVideoMetadata(webmFile, 50);
    expect(metadataWebm.containerType).toBe('webm');
    expect(metadataWebm.isWebCodecsFastPathCompatible).toBe(false); // WebM routes to ffmpeg

    const mkvFile = new File(['fake mkv'], 'movie.mkv', { type: 'video/x-matroska' });
    const metadataMkv = await extractVideoMetadata(mkvFile, 50);
    expect(metadataMkv.containerType).toBe('mkv');
    expect(metadataMkv.isWebCodecsFastPathCompatible).toBe(false);
  });
});
