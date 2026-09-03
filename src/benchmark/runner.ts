import type { OperationDescriptor, VideoMetadata } from '../types';
import { EngineExecutor } from '../engine/executor';

export interface SingleEngineRunResult {
  engine: 'webcodecs' | 'ffmpeg';
  durationMs: number;
  outputSizeBytes: number;
  success: boolean;
  errorMessage?: string;
  memoryUsedMb?: number;
}

export interface BenchmarkComparison {
  operationName: string;
  webcodecs: SingleEngineRunResult;
  ffmpeg: SingleEngineRunResult;
  speedupFactor: number; // e.g. 15.5x faster
  timeSavedMs: number;
  recommendedEngine: 'webcodecs' | 'ffmpeg';
  timestamp: string;
}

export interface BenchmarkReport {
  deviceInfo: {
    userAgent: string;
    hardwareConcurrency: number;
    deviceMemoryGb?: number;
  };
  comparisons: BenchmarkComparison[];
  generatedAt: string;
}

/**
 * BenchmarkRunner
 * Automated harness to benchmark operations across WebCodecs and ffmpeg.wasm engines.
 */
export class BenchmarkRunner {
  private static getMemoryUsed(): number | undefined {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const mem = (performance as any).memory;
      return Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 100) / 100;
    }
    return undefined;
  }

  /**
   * Runs an operation on a specific engine and measures exact timing and resource usage.
   */
  public static async runEngine(
    engine: 'webcodecs' | 'ffmpeg',
    operation: OperationDescriptor,
    buffer: ArrayBuffer,
    fileName: string,
    metadata?: VideoMetadata | null
  ): Promise<SingleEngineRunResult> {
    const memBefore = this.getMemoryUsed();
    const start = performance.now();

    try {
      const cloned = buffer.slice(0);
      const res = await EngineExecutor.execute({
        operation,
        buffers: [cloned],
        fileName,
        metadata,
      });

      const durationMs = Math.round((performance.now() - start) * 10) / 10;
      const memAfter = this.getMemoryUsed();
      const memoryUsedMb = memBefore && memAfter ? Math.max(0, memAfter - memBefore) : undefined;

      return {
        engine,
        durationMs,
        outputSizeBytes: res.blob.size,
        success: true,
        memoryUsedMb,
      };
    } catch (err: any) {
      const durationMs = Math.round((performance.now() - start) * 10) / 10;
      return {
        engine,
        durationMs,
        outputSizeBytes: 0,
        success: false,
        errorMessage: err?.message || 'Execution error',
      };
    }
  }

  /**
   * Compares the same operation across both WebCodecs and ffmpeg.wasm engines.
   */
  public static async compareOperation(
    operationName: string,
    operation: OperationDescriptor,
    buffer: ArrayBuffer,
    fileName: string,
    metadata?: VideoMetadata | null
  ): Promise<BenchmarkComparison> {
    // 1. Run WebCodecs Fast Path
    const wcResult = await this.runEngine('webcodecs', operation, buffer, fileName, metadata);

    // 2. Run ffmpeg.wasm Slow Path
    const ffResult = await this.runEngine('ffmpeg', operation, buffer, fileName, metadata);

    const speedupFactor =
      wcResult.durationMs > 0 && ffResult.durationMs > 0
        ? Math.round((ffResult.durationMs / wcResult.durationMs) * 10) / 10
        : 1.0;

    const timeSavedMs = Math.max(0, ffResult.durationMs - wcResult.durationMs);

    return {
      operationName,
      webcodecs: wcResult,
      ffmpeg: ffResult,
      speedupFactor,
      timeSavedMs,
      recommendedEngine: speedupFactor > 1.2 ? 'webcodecs' : 'ffmpeg',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generates a Markdown report from benchmark comparisons.
   */
  public static generateMarkdownReport(report: BenchmarkReport): string {
    let md = `# Video-Cut Benchmark Report\n\n`;
    md += `*Generated: ${report.generatedAt}*\n`;
    md += `- **User Agent**: \`${report.deviceInfo.userAgent}\`\n`;
    md += `- **CPU Cores**: ${report.deviceInfo.hardwareConcurrency}\n`;
    if (report.deviceInfo.deviceMemoryGb) {
      md += `- **Device Memory**: ~${report.deviceInfo.deviceMemoryGb} GB\n`;
    }
    md += `\n---\n\n`;
    md += `| การทำงาน (Operation) | WebCodecs (ms) | ffmpeg.wasm (ms) | ความเร็วเพิ่มขึ้น (Speedup) | แนะนำ |\n`;
    md += `|---|---|---|---|---|\n`;

    for (const c of report.comparisons) {
      const wc = c.webcodecs.success ? `${c.webcodecs.durationMs} ms` : 'Failed';
      const ff = c.ffmpeg.success ? `${c.ffmpeg.durationMs} ms` : 'Failed';
      const sp = c.speedupFactor > 1 ? `⚡ **${c.speedupFactor}x เร็วกว่า**` : '1.0x';
      const rec = c.recommendedEngine === 'webcodecs' ? 'WebCodecs ⚡' : 'ffmpeg 🔧';

      md += `| ${c.operationName} | ${wc} | ${ff} | ${sp} | ${rec} |\n`;
    }

    return md;
  }
}
