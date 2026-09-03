import type {
  WorkerRequestMessage,
  WorkerResponseMessage,
  TrimOperationDescriptor,
  MultiTrimConcatOperationDescriptor,
  ConvertOperationDescriptor,
  CropOperationDescriptor,
} from '../types';
import { fastKeyframeTrim } from '../engine/webcodecs/fastTrim';
import { fastConcat } from '../engine/webcodecs/fastConcat';
import { FFmpegEngine } from '../engine/ffmpeg/engine';

self.onmessage = async (event: MessageEvent<WorkerRequestMessage>) => {
  const msg = event.data;
  if (!msg || msg.type !== 'execute') return;

  const { id, operation, engine, buffers, fileName } = msg;
  const startTime = Date.now();

  const reportProgress = (percent: number, status: string) => {
    const progressResponse: WorkerResponseMessage = {
      type: 'progress',
      id,
      percent,
      status,
    };
    self.postMessage(progressResponse);
  };

  try {
    let resultBlob: Blob;

    if (engine === 'webcodecs') {
      // ----------------- WebCodecs Fast Path -----------------
      if (operation.type === 'trim') {
        const op = operation as TrimOperationDescriptor;
        resultBlob = await fastKeyframeTrim(
          buffers[0],
          op.startSeconds,
          op.endSeconds,
          reportProgress
        );
      } else if (operation.type === 'concat') {
        resultBlob = await fastConcat(buffers, reportProgress);
      } else if (operation.type === 'multiTrimConcat') {
        const op = operation as MultiTrimConcatOperationDescriptor;
        if (buffers.length === 1) {
          resultBlob = await fastKeyframeTrim(
            buffers[0],
            op.clips[0].startSeconds,
            op.clips[0].endSeconds,
            reportProgress
          );
        } else {
          const trimmedBuffers: ArrayBuffer[] = [];
          for (let i = 0; i < buffers.length; i++) {
            const clip = op.clips[i] || { startSeconds: 0, endSeconds: 99999 };
            reportProgress(
              Math.round((i / buffers.length) * 45),
              `กำลังตัดคลิปที่ ${i + 1}/${buffers.length}...`
            );
            const trimmed = await fastKeyframeTrim(
              buffers[i],
              clip.startSeconds,
              clip.endSeconds
            );
            trimmedBuffers.push(await trimmed.arrayBuffer());
          }
          reportProgress(50, 'กำลังรวมคลิปทั้งหมดเข้าด้วยกัน...');
          resultBlob = await fastConcat(trimmedBuffers, (pct, status) => {
            reportProgress(50 + Math.round(pct * 0.5), status);
          });
        }
      } else {
        throw new Error(`WebCodecs engine does not support operation: ${operation.type}`);
      }
    } else {
      // ----------------- ffmpeg.wasm Slow Path -----------------
      if (operation.type === 'trim') {
        const op = operation as TrimOperationDescriptor;
        resultBlob = await FFmpegEngine.frameAccurateTrim(
          buffers[0],
          op.startSeconds,
          op.endSeconds,
          reportProgress
        );
      } else if (operation.type === 'concat') {
        const inputs = buffers.map((buf, i) => ({
          name: `clip_${i}.mp4`,
          data: buf,
        }));
        resultBlob = await FFmpegEngine.crossFormatConcat(inputs, 60, reportProgress);
      } else if (operation.type === 'multiTrimConcat') {
        const op = operation as MultiTrimConcatOperationDescriptor;
        if (buffers.length === 1) {
          resultBlob = await FFmpegEngine.frameAccurateTrim(
            buffers[0],
            op.clips[0].startSeconds,
            op.clips[0].endSeconds,
            reportProgress
          );
        } else {
          const trimmedBuffers: ArrayBuffer[] = [];
          for (let i = 0; i < buffers.length; i++) {
            const clip = op.clips[i] || { startSeconds: 0, endSeconds: 99999 };
            reportProgress(
              Math.round((i / buffers.length) * 45),
              `กำลังตัดคลิปที่ ${i + 1}/${buffers.length}...`
            );
            const trimmed = await FFmpegEngine.frameAccurateTrim(
              buffers[i],
              clip.startSeconds,
              clip.endSeconds
            );
            trimmedBuffers.push(await trimmed.arrayBuffer());
          }
          reportProgress(50, 'กำลังรวมคลิปทั้งหมดเข้าด้วยกัน...');
          const inputs = trimmedBuffers.map((buf, i) => ({
            name: `trimmed_${i}.mp4`,
            data: buf,
          }));
          resultBlob = await FFmpegEngine.crossFormatConcat(inputs, 60, (pct, status) => {
            reportProgress(50 + Math.round(pct * 0.5), status);
          });
        }
      } else if (operation.type === 'convert') {
        const op = operation as ConvertOperationDescriptor;
        resultBlob = await FFmpegEngine.convertFormat(
          buffers[0],
          op.targetFormat,
          60,
          reportProgress
        );
      } else if (operation.type === 'crop') {
        const op = operation as CropOperationDescriptor;
        const filter = `crop=${op.width}:${op.height}:${op.x}:${op.y}`;
        resultBlob = await FFmpegEngine.cropVideo(buffers[0], filter, 60, reportProgress);
      } else {
        throw new Error(`Unsupported operation: ${operation.type}`);
      }
    }

    const resultBuffer = await resultBlob.arrayBuffer();
    let duration = 0;
    if (operation.type === 'trim') {
      duration = (operation as TrimOperationDescriptor).endSeconds - (operation as TrimOperationDescriptor).startSeconds;
    } else if (operation.type === 'multiTrimConcat') {
      duration = (operation as MultiTrimConcatOperationDescriptor).clips.reduce(
        (sum, c) => sum + Math.max(0, c.endSeconds - c.startSeconds),
        0
      );
    }

    const successResponse: WorkerResponseMessage = {
      type: 'success',
      id,
      resultBuffer,
      mimeType: resultBlob.type,
      duration,
      engine,
      processingTimeMs: Date.now() - startTime,
      fileName: `edited_${fileName}`,
    };

    // Transfer resultBuffer ownership back to main thread
    self.postMessage(successResponse, [resultBuffer]);
  } catch (err: any) {
    const errorResponse: WorkerResponseMessage = {
      type: 'error',
      id,
      message: err?.message || 'Unknown processing error occurred',
      canRetryWithFFmpeg: engine === 'webcodecs',
    };
    self.postMessage(errorResponse);
  }
};
