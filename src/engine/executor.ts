import { EngineRouter } from './router';
import { isWebCodecsSupported } from './capabilities';
import type {
  OperationDescriptor,
  VideoMetadata,
  EngineResult,
  ProgressCallback,
  WorkerRequestMessage,
  WorkerResponseMessage,
  EngineName,
} from '../types';

export interface ExecuteOptions {
  operation: OperationDescriptor;
  buffers: ArrayBuffer[];
  fileName: string;
  metadata?: VideoMetadata | null;
  onProgress?: ProgressCallback;
}

/**
 * EngineExecutor
 * Manages job dispatching to ProcessingWorker, monitors progress,
 * and executes automatic fallback (WebCodecs -> ffmpeg.wasm) on runtime errors.
 */
export class EngineExecutor {
  private static workerInstance: Worker | null = null;

  private static getWorker(): Worker | null {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return null;
    }
    if (!this.workerInstance) {
      this.workerInstance = new Worker(
        new URL('../workers/processing.worker.ts', import.meta.url),
        { type: 'module' }
      );
    }
    return this.workerInstance;
  }

  /**
   * Executes a video editing operation with automatic routing and fallback.
   */
  public static async execute(options: ExecuteOptions): Promise<EngineResult> {
    const { operation, metadata, onProgress } = options;
    const hasWebCodecs = isWebCodecsSupported();

    // 1. Initial routing decision
    const initialRoute = EngineRouter.route(operation, metadata, hasWebCodecs);
    let currentEngine = initialRoute.engine;

    try {
      return await this.dispatchToEngine(currentEngine, options);
    } catch (primaryError: any) {
      // 2. Automatic Fallback: if WebCodecs fails, retry once via ffmpeg.wasm
      if (currentEngine === 'webcodecs') {
        console.warn(
          `[EngineExecutor] WebCodecs execution failed: "${primaryError.message}". Falling back to ffmpeg.wasm...`
        );
        onProgress?.(
          5,
          '⚠️ WebCodecs ขัดข้อง — กำลังสลับไปใช้ ffmpeg.wasm สำรองโดยอัตโนมัติ (อาจใช้เวลาเพิ่มขึ้น)...'
        );

        currentEngine = 'ffmpeg';
        return await this.dispatchToEngine('ffmpeg', options);
      }

      throw primaryError;
    }
  }

  /**
   * Internal dispatcher through worker message channel
   */
  private static dispatchToEngine(
    engine: EngineName,
    options: ExecuteOptions
  ): Promise<EngineResult> {
    return new Promise((resolve, reject) => {
      const worker = this.getWorker();
      const id = `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      if (!worker) {
        reject(new Error('Web Worker is not supported in this environment'));
        return;
      }

      const handleMessage = (e: MessageEvent<WorkerResponseMessage>) => {
        const msg = e.data;
        if (!msg || msg.id !== id) return;

        if (msg.type === 'progress') {
          options.onProgress?.(msg.percent, msg.status);
        } else if (msg.type === 'success') {
          worker.removeEventListener('message', handleMessage);
          const blob = new Blob([msg.resultBuffer], { type: msg.mimeType });
          resolve({
            blob,
            duration: msg.duration,
            engine: msg.engine,
            processingTimeMs: msg.processingTimeMs,
            fileName: msg.fileName,
          });
        } else if (msg.type === 'error') {
          worker.removeEventListener('message', handleMessage);
          reject(new Error(msg.message));
        }
      };

      worker.addEventListener('message', handleMessage);

      // Clone buffers so original buffers aren't detached if retry is needed
      const clonedBuffers = options.buffers.map(buf => buf.slice(0));

      const request: WorkerRequestMessage = {
        type: 'execute',
        id,
        operation: options.operation,
        engine,
        buffers: clonedBuffers,
        fileName: options.fileName,
      };

      // Transfer cloned buffers to worker
      worker.postMessage(request, clonedBuffers);
    });
  }
}
