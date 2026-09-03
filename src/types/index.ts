export type OperationType = 'trim' | 'concat' | 'convert' | 'crop' | 'resize' | 'multiTrimConcat';

export type EngineName = 'webcodecs' | 'ffmpeg';

export interface KeyframeInfo {
  timeSeconds: number;
  sampleNumber: number;
  offset: number;
}

export interface VideoMetadata {
  name: string;
  sizeBytes: number;
  duration: number; // in seconds
  width: number;
  height: number;
  videoCodec?: string;
  audioCodec?: string;
  hasAudio: boolean;
  fps?: number;
  bitrate?: number;
  keyframes?: KeyframeInfo[];
  isWebCodecsFastPathCompatible: boolean;
  containerType: 'mp4' | 'mov' | 'webm' | 'mkv' | 'unknown';
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  extension: string;
  mimeType: string;
}

export interface EnvironmentSupport {
  isCrossOriginIsolated: boolean;
  hasSharedArrayBuffer: boolean;
  hasWebCodecs: boolean;
  hasVideoDecoder: boolean;
  hasVideoEncoder: boolean;
  hasAudioDecoder: boolean;
  hasAudioEncoder: boolean;
  hasOPFS: boolean;
}

// =================== Operation Descriptors ===================

export interface TrimOperationDescriptor {
  type: 'trim';
  startSeconds: number;
  endSeconds: number;
  keyframeAligned: boolean; // true = fast-path stream copy, false = frame-accurate
}

export interface ConcatOperationDescriptor {
  type: 'concat';
  sameFormat: boolean;
}

export interface ConvertOperationDescriptor {
  type: 'convert';
  targetFormat: 'mp4' | 'webm' | 'mov';
}

export interface CropOperationDescriptor {
  type: 'crop';
  x: number;
  y: number;
  width: number;
  height: number;
  targetAspectRatio?: string; // e.g. '16:9', '9:16', '1:1', '4:3'
}

export interface ResizeOperationDescriptor {
  type: 'resize';
  width: number;
  height: number;
}

export interface ClipTrimConfig {
  startSeconds: number;
  endSeconds: number;
}

export interface MultiTrimConcatOperationDescriptor {
  type: 'multiTrimConcat';
  clips: ClipTrimConfig[];
  keyframeAligned: boolean;
  sameFormat: boolean;
}

export type OperationDescriptor =
  | TrimOperationDescriptor
  | ConcatOperationDescriptor
  | MultiTrimConcatOperationDescriptor
  | ConvertOperationDescriptor
  | CropOperationDescriptor
  | ResizeOperationDescriptor;

export interface EngineResult {
  blob: Blob;
  duration: number;
  engine: EngineName;
  processingTimeMs: number;
  fileName: string;
}

export type ProgressCallback = (percent: number, status: string) => void;

// =================== Worker Message Protocols ===================

export type WorkerRequestMessage =
  | {
      type: 'execute';
      id: string;
      operation: OperationDescriptor;
      engine: EngineName;
      buffers: ArrayBuffer[];
      fileName: string;
    }
  | {
      type: 'cancel';
      id: string;
    };

export type WorkerResponseMessage =
  | {
      type: 'progress';
      id: string;
      percent: number;
      status: string;
    }
  | {
      type: 'success';
      id: string;
      resultBuffer: ArrayBuffer;
      mimeType: string;
      duration: number;
      engine: EngineName;
      processingTimeMs: number;
      fileName: string;
    }
  | {
      type: 'error';
      id: string;
      message: string;
      canRetryWithFFmpeg: boolean;
    };
