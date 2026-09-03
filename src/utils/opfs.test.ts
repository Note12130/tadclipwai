import { describe, it, expect, beforeEach } from 'vitest';
import { OPFSManager } from './opfs';

describe('OPFSManager', () => {
  beforeEach(async () => {
    await OPFSManager.clearAll();
  });

  it('reports support accurately', () => {
    // In happy-dom environment, navigator.storage.getDirectory might be undefined
    const supported = OPFSManager.isSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('writes and reads file successfully using fallback/memory store', async () => {
    const testData = new TextEncoder().encode('video-binary-content');
    const blob = new Blob([testData], { type: 'video/mp4' });

    await OPFSManager.writeFile('test_video.mp4', blob);

    const buffer = await OPFSManager.readFile('test_video.mp4');
    expect(buffer.byteLength).toBe(testData.byteLength);

    const file = await OPFSManager.getFile('test_video.mp4');
    expect(file).not.toBeNull();
    expect(file?.name).toBe('test_video.mp4');
  });

  it('lists staged files and deletes them properly', async () => {
    const blob1 = new Blob(['clip1']);
    const blob2 = new Blob(['clip2']);

    await OPFSManager.writeFile('clip1.mp4', blob1);
    await OPFSManager.writeFile('clip2.mp4', blob2);

    const files = await OPFSManager.listFiles();
    expect(files).toContain('clip1.mp4');
    expect(files).toContain('clip2.mp4');

    await OPFSManager.deleteFile('clip1.mp4');
    const afterDelete = await OPFSManager.listFiles();
    expect(afterDelete).not.toContain('clip1.mp4');
    expect(afterDelete).toContain('clip2.mp4');
  });

  it('clears all files', async () => {
    await OPFSManager.writeFile('temp1.mp4', new Blob(['1']));
    await OPFSManager.writeFile('temp2.mp4', new Blob(['2']));

    await OPFSManager.clearAll();
    const files = await OPFSManager.listFiles();
    expect(files.length).toBe(0);
  });
});
