import type { OperationDescriptor, VideoMetadata, EngineName } from '../types';

export interface RouteDecision {
  engine: EngineName;
  reason: string;
}

/**
 * EngineRouter
 * Selects the optimal processing engine (WebCodecs Fast Path vs ffmpeg.wasm)
 * based on the requested operation, input container/codec, and device capabilities.
 */
export class EngineRouter {
  public static route(
    operation: OperationDescriptor,
    metadata?: VideoMetadata | null,
    hasWebCodecsSupport = true
  ): RouteDecision {
    // Rule 1: If browser does not support WebCodecs, fallback to ffmpeg.wasm
    if (!hasWebCodecsSupport) {
      return {
        engine: 'ffmpeg',
        reason: 'เบราว์เซอร์ไม่รองรับ WebCodecs API จึงสลับไปใช้ ffmpeg.wasm',
      };
    }

    // Rule 2: Inspect operation type
    switch (operation.type) {
      case 'trim': {
        // Keyframe-aligned cut on compatible MP4/MOV can use WebCodecs fast path
        if (operation.keyframeAligned) {
          if (metadata && !metadata.isWebCodecsFastPathCompatible) {
            return {
              engine: 'ffmpeg',
              reason: 'คอนเทนเนอร์หรือ Codec ไม่รองรับการตัดระดับ Container Stream-Copy จำเป็นต้องใช้ ffmpeg.wasm',
            };
          }
          return {
            engine: 'webcodecs',
            reason: 'ตัดตรงตำแหน่ง Keyframe (Stream-Copy ไม่ต้อง re-encode — เสร็จใน < 2 วินาที)',
          };
        }

        // Frame-accurate trim requires re-encoding arbitrary non-keyframe frames
        return {
          engine: 'ffmpeg',
          reason: 'การตัดละเอียดแบบรายเฟรม (Frame-accurate) ต้องถอดรหัสและเข้ารหัสใหม่ผ่าน ffmpeg.wasm',
        };
      }

      case 'concat': {
        if (operation.sameFormat) {
          if (metadata && !metadata.isWebCodecsFastPathCompatible) {
            return {
              engine: 'ffmpeg',
              reason: 'ไฟล์วิดีโอมี Codec ไม่ตรงตามเงื่อนไข WebCodecs Stream-Copy สลับไปใช้ ffmpeg.wasm',
            };
          }
          return {
            engine: 'webcodecs',
            reason: 'รวมไฟล์วิดีโอที่มี Codec และความละเอียดตรงกัน (Stream-Copy ไม่ต้อง re-encode)',
          };
        }
        return {
          engine: 'ffmpeg',
          reason: 'รวมไฟล์วิดีโอที่มีรูปแบบแตกต่างกัน ต้อง normalize format ผ่าน ffmpeg.wasm',
        };
      }

      case 'multiTrimConcat': {
        if (operation.keyframeAligned && operation.sameFormat) {
          if (metadata && !metadata.isWebCodecsFastPathCompatible) {
            return {
              engine: 'ffmpeg',
              reason: 'ไฟล์วิดีโอมี Codec ไม่ตรงตามเงื่อนไข WebCodecs Stream-Copy สลับไปใช้ ffmpeg.wasm',
            };
          }
          return {
            engine: 'webcodecs',
            reason: 'ตัดและรวมคลิปแบบ Keyframe Stream-Copy (ไม่ต้อง re-encode — รวดเร็วมาก ⚡)',
          };
        }
        return {
          engine: 'ffmpeg',
          reason: 'ตัดและรวมคลิปแบบรายเฟรม (Frame-accurate) หรือมี format ต่างกัน จะใช้ ffmpeg.wasm 🔧',
        };
      }

      case 'convert': {
        return {
          engine: 'ffmpeg',
          reason: 'การแปลงรูปแบบ Container และ Codec จำเป็นต้องใช้ ffmpeg.wasm',
        };
      }

      case 'crop':
      case 'resize': {
        return {
          engine: 'ffmpeg',
          reason: 'การ Crop และปรับความละเอียดต้องใช้ Filter Graph ของ ffmpeg.wasm',
        };
      }

      default: {
        return {
          engine: 'ffmpeg',
          reason: 'การทำงานที่ซับซ้อนสลับไปใช้ ffmpeg.wasm เป็นหลัก',
        };
      }
    }
  }
}
