import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { calculateFFmpegProgress } from '../progress';
import type { ProgressCallback } from '../../types';

/**
 * FFmpegEngine Singleton
 * Wraps @ffmpeg/ffmpeg v0.12+ with lazy loading, single-instance caching,
 * progress tracking from stdout logs, and MEMFS cleanup.
 */
export class FFmpegEngine {
  private static instance: FFmpeg | null = null;
  private static loadPromise: Promise<FFmpeg> | null = null;

  /**
   * Initializes and returns the shared FFmpeg instance.
   * Loads core wasm binaries lazily once.
   */
  public static async getInstance(onProgress?: ProgressCallback): Promise<FFmpeg> {
    if (this.instance && this.instance.loaded) {
      return this.instance;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      onProgress?.(5, 'กำลังโหลดไลบรารี ffmpeg.wasm...');

      const ffmpeg = new FFmpeg();

      // Configure CDN base for ffmpeg-core binaries
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';

      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        this.instance = ffmpeg;
        return ffmpeg;
      } catch (err) {
        console.error('[FFmpegEngine] Failed to load ffmpeg core:', err);
        throw err;
      }
    })();

    return this.loadPromise;
  }

  /**
   * C-11: Frame-accurate trim with audio sync (handles video-only files via -an)
   */
  public static async frameAccurateTrim(
    inputData: Uint8Array | ArrayBuffer,
    startSeconds: number,
    endSeconds: number,
    onProgress?: ProgressCallback,
    hasAudio = true
  ): Promise<Blob> {
    const ffmpeg = await this.getInstance(onProgress);
    const inputName = `input_${Date.now()}.mp4`;
    const outputName = `output_${Date.now()}.mp4`;

    const duration = Math.max(0.1, endSeconds - startSeconds);

    const logListener = ({ message }: { message: string }) => {
      const p = calculateFFmpegProgress(message, duration);
      if (p !== null) {
        onProgress?.(Math.min(95, 10 + Math.round(p * 0.85)), `กำลังตัดวิดีโอ... (${p}%)`);
      }
    };

    ffmpeg.on('log', logListener);

    try {
      const data = inputData instanceof Uint8Array ? inputData : new Uint8Array(inputData);
      await ffmpeg.writeFile(inputName, data);

      onProgress?.(15, 'กำลังประมวลผลการตัดแบบละเอียด (Frame-Accurate)...');

      const args = [
        '-ss',
        String(startSeconds),
        '-to',
        String(endSeconds),
        '-i',
        inputName,
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
      ];

      if (hasAudio) {
        args.push('-c:a', 'aac');
      } else {
        args.push('-an'); // Strip audio / prevent missing audio stream error
      }

      args.push(outputName);

      await ffmpeg.exec(args);

      const outputData = await ffmpeg.readFile(outputName);
      const outputBytes = outputData as Uint8Array;

      onProgress?.(100, 'ตัดต่อเสร็จเรียบร้อย');
      return new Blob([outputBytes.buffer as ArrayBuffer], { type: 'video/mp4' });
    } finally {
      ffmpeg.off('log', logListener);
      // Clean up MEMFS virtual files
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
    }
  }

  /**
   * C-12: Cross-format concat (re-encode)
   */
  public static async crossFormatConcat(
    inputs: { name: string; data: Uint8Array | ArrayBuffer }[],
    totalDurationSeconds: number,
    onProgress?: ProgressCallback
  ): Promise<Blob> {
    const ffmpeg = await this.getInstance(onProgress);
    const outputName = `concat_${Date.now()}.mp4`;
    const listFileName = `concat_list_${Date.now()}.txt`;

    const logListener = ({ message }: { message: string }) => {
      const p = calculateFFmpegProgress(message, totalDurationSeconds);
      if (p !== null) {
        onProgress?.(Math.min(95, 15 + Math.round(p * 0.8)), `กำลังรวมไฟล์วิดีโอ... (${p}%)`);
      }
    };

    ffmpeg.on('log', logListener);

    try {
      let listContent = '';
      for (let i = 0; i < inputs.length; i++) {
        const item = inputs[i];
        const vName = `file_${i}_${Date.now()}_${item.name}`;
        const data = item.data instanceof Uint8Array ? item.data : new Uint8Array(item.data);
        await ffmpeg.writeFile(vName, data);
        listContent += `file '${vName}'\n`;
      }

      await ffmpeg.writeFile(listFileName, new TextEncoder().encode(listContent));

      onProgress?.(20, 'กำลังรัน ffmpeg concat filter...');
      await ffmpeg.exec([
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        listFileName,
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-c:a',
        'aac',
        outputName,
      ]);

      const outputData = await ffmpeg.readFile(outputName);
      const outputBytes = outputData as Uint8Array;

      onProgress?.(100, 'รวมไฟล์เสร็จสมบูรณ์');
      return new Blob([outputBytes.buffer as ArrayBuffer], { type: 'video/mp4' });
    } finally {
      ffmpeg.off('log', logListener);
      await ffmpeg.deleteFile(listFileName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
    }
  }

  /**
   * C-13: Format conversion (MOV/WebM/MKV -> MP4 or WebM)
   */
  public static async convertFormat(
    inputData: Uint8Array | ArrayBuffer,
    targetFormat: 'mp4' | 'webm' | 'mov',
    durationSeconds = 60,
    onProgress?: ProgressCallback
  ): Promise<Blob> {
    const ffmpeg = await this.getInstance(onProgress);
    const inputName = `convert_in_${Date.now()}.bin`;
    const outputName = `convert_out_${Date.now()}.${targetFormat}`;

    const logListener = ({ message }: { message: string }) => {
      const p = calculateFFmpegProgress(message, durationSeconds);
      if (p !== null) {
        onProgress?.(Math.min(95, 10 + Math.round(p * 0.85)), `กำลังแปลงรูปแบบไฟล์... (${p}%)`);
      }
    };

    ffmpeg.on('log', logListener);

    try {
      const data = inputData instanceof Uint8Array ? inputData : new Uint8Array(inputData);
      await ffmpeg.writeFile(inputName, data);

      onProgress?.(15, `กำลังแปลงเป็น .${targetFormat}...`);

      const args = ['-i', inputName];
      if (targetFormat === 'mp4') {
        args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac');
      } else if (targetFormat === 'webm') {
        args.push('-c:v', 'libvpx', '-c:a', 'libvorbis');
      }
      args.push(outputName);

      await ffmpeg.exec(args);

      const outputData = await ffmpeg.readFile(outputName);
      const outputBytes = outputData as Uint8Array;

      onProgress?.(100, 'แปลงรูปแบบเสร็จเรียบร้อย');
      const mime = targetFormat === 'webm' ? 'video/webm' : targetFormat === 'mov' ? 'video/quicktime' : 'video/mp4';
      return new Blob([outputBytes.buffer as ArrayBuffer], { type: mime });
    } finally {
      ffmpeg.off('log', logListener);
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
    }
  }

  /**
   * C-14: Crop / Aspect Ratio Filter
   */
  public static async cropVideo(
    inputData: Uint8Array | ArrayBuffer,
    cropFilter: string, // e.g. "crop=1080:1080:420:0"
    durationSeconds = 60,
    onProgress?: ProgressCallback,
    hasAudio = true
  ): Promise<Blob> {
    const ffmpeg = await this.getInstance(onProgress);
    const inputName = `crop_in_${Date.now()}.mp4`;
    const outputName = `crop_out_${Date.now()}.mp4`;

    const logListener = ({ message }: { message: string }) => {
      const p = calculateFFmpegProgress(message, durationSeconds);
      if (p !== null) {
        onProgress?.(Math.min(95, 10 + Math.round(p * 0.85)), `กำลัง Crop วิดีโอ... (${p}%)`);
      }
    };

    ffmpeg.on('log', logListener);

    try {
      const data = inputData instanceof Uint8Array ? inputData : new Uint8Array(inputData);
      await ffmpeg.writeFile(inputName, data);

      onProgress?.(15, 'กำลังประมวลผล Crop Filter...');

      const args = [
        '-i',
        inputName,
        '-vf',
        cropFilter,
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
      ];

      if (hasAudio) {
        args.push('-c:a', 'copy');
      } else {
        args.push('-an');
      }

      args.push(outputName);
      await ffmpeg.exec(args);

      const outputData = await ffmpeg.readFile(outputName);
      const outputBytes = outputData as Uint8Array;

      onProgress?.(100, 'Crop วิดีโอเสร็จเรียบร้อย');
      return new Blob([outputBytes.buffer as ArrayBuffer], { type: 'video/mp4' });
    } finally {
      ffmpeg.off('log', logListener);
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
    }
  }
}
