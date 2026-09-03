import MP4Box from 'mp4box';
import type { VideoMetadata, KeyframeInfo } from '../types';

/**
 * Checks if a codec string is compatible with the WebCodecs stream-copy fast path.
 */
export function isFastPathCodec(videoCodec?: string): boolean {
  if (!videoCodec) return false;
  const lower = videoCodec.toLowerCase();
  // H.264 (avc1), H.265 (hvc1/hev1), VP9 (vp09), AV1 (av01)
  return (
    lower.startsWith('avc1') ||
    lower.startsWith('hvc1') ||
    lower.startsWith('hev1') ||
    lower.startsWith('vp09') ||
    lower.startsWith('av01')
  );
}

/**
 * Probes video metadata using HTML5 <video> element as a universal fallback
 * (useful for WebM, MKV, or MP4 files with non-standard atom placement).
 */
export function probeWithVideoElement(
  file: File,
  timeoutMs = 1500
): Promise<Partial<VideoMetadata>> {
  return new Promise((resolve) => {
    // In node/test environments without window or HTMLVideoElement
    if (typeof window === 'undefined' || typeof document === 'undefined' || !window.HTMLVideoElement) {
      resolve({ duration: 0, width: 0, height: 0 });
      return;
    }

    let isSettled = false;
    const video = document.createElement('video');
    video.preload = 'metadata';
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      resolve({ duration: 0, width: 0, height: 0 });
      return;
    }

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    const settle = (result: Partial<VideoMetadata>) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);
      cleanup();
      resolve(result);
    };

    const timer = setTimeout(() => {
      settle({ duration: 0, width: 0, height: 0 });
    }, timeoutMs);

    video.onloadedmetadata = () => {
      const duration = isFinite(video.duration) ? video.duration : 0;
      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;
      settle({ duration, width, height });
    };

    video.onerror = () => {
      settle({ duration: 0, width: 0, height: 0 });
    };

    video.src = objectUrl;
  });
}

/**
 * Parses an MP4/MOV container using mp4box.js.
 */
export function parseMP4Metadata(
  buffer: ArrayBuffer,
  timeoutMs = 500
): Promise<{
  duration: number;
  width: number;
  height: number;
  videoCodec?: string;
  audioCodec?: string;
  hasAudio: boolean;
  fps?: number;
  keyframes: KeyframeInfo[];
}> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('MP4 parsing timeout (incomplete or invalid container atoms)'));
      }
    }, timeoutMs);

    try {
      const mp4boxfile = MP4Box.createFile();

      mp4boxfile.onError = (err: unknown) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      };

      mp4boxfile.onReady = (info: any) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);

          let videoTrack: any = null;
          let audioTrack: any = null;

          if (info.tracks && Array.isArray(info.tracks)) {
            for (const track of info.tracks) {
              if (track.video && !videoTrack) {
                videoTrack = track;
              } else if (track.audio && !audioTrack) {
                audioTrack = track;
              }
            }
          }

          const duration = info.duration && info.timescale
            ? info.duration / info.timescale
            : 0;

          const width = videoTrack?.video?.width || videoTrack?.track_width || 0;
          const height = videoTrack?.video?.height || videoTrack?.track_height || 0;
          const videoCodec = videoTrack?.codec;
          const audioCodec = audioTrack?.codec;
          const hasAudio = Boolean(audioTrack);

          // Approximate FPS from video track
          let fps: number | undefined;
          if (videoTrack?.nb_samples && duration > 0) {
            fps = Math.round((videoTrack.nb_samples / duration) * 10) / 10;
          }

          const keyframes: KeyframeInfo[] = [];

          resolve({
            duration,
            width,
            height,
            videoCodec,
            audioCodec,
            hasAudio,
            fps,
            keyframes,
          });
        }
      };

      // Set fileStart offset for mp4box
      const fileBuffer = buffer as any;
      fileBuffer.fileStart = 0;
      mp4boxfile.appendBuffer(fileBuffer);
      mp4boxfile.flush();
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    }
  });
}

/**
 * High-level function to extract comprehensive metadata from any supported video file.
 */
export async function extractVideoMetadata(
  file: File,
  probeTimeoutMs = 1000
): Promise<VideoMetadata> {
  const extension = (file.name.split('.').pop() || '').toLowerCase();
  const containerType = (['mp4', 'mov', 'webm', 'mkv'].includes(extension)
    ? extension
    : 'unknown') as VideoMetadata['containerType'];

  let duration = 0;
  let width = 0;
  let height = 0;
  let videoCodec: string | undefined;
  let audioCodec: string | undefined;
  let hasAudio = false;
  let fps: number | undefined;
  let keyframes: KeyframeInfo[] = [];

  // Try mp4box parsing for MP4 / MOV containers
  if (extension === 'mp4' || extension === 'mov' || extension === 'm4v') {
    try {
      // Read first 2MB or full buffer if small for fast moov atom detection
      const sliceSize = Math.min(file.size, 10 * 1024 * 1024); // read up to 10MB
      const buffer = await file.slice(0, sliceSize).arrayBuffer();
      const parsed = await parseMP4Metadata(buffer, probeTimeoutMs);

      duration = parsed.duration;
      width = parsed.width;
      height = parsed.height;
      videoCodec = parsed.videoCodec;
      audioCodec = parsed.audioCodec;
      hasAudio = parsed.hasAudio;
      fps = parsed.fps;
      keyframes = parsed.keyframes;
    } catch (err) {
      console.warn('[Metadata] MP4Box parse failed, falling back to VideoElement probe:', err);
    }
  }

  // Fallback to HTML5 video element probe if duration or dimensions are missing
  if (duration === 0 || width === 0) {
    const probe = await probeWithVideoElement(file, probeTimeoutMs);
    duration = duration || probe.duration || 0;
    width = width || probe.width || 0;
    height = height || probe.height || 0;
  }

  // Determine WebCodecs fast path eligibility
  const isCompatibleCodec = isFastPathCodec(videoCodec);
  const isCompatibleContainer = containerType === 'mp4' || containerType === 'mov';
  const isWebCodecsFastPathCompatible = isCompatibleContainer && (isCompatibleCodec || !videoCodec);

  // Bitrate estimation
  let bitrate: number | undefined;
  if (duration > 0 && file.size > 0) {
    bitrate = Math.round((file.size * 8) / duration); // bits per second
  }

  return {
    name: file.name,
    sizeBytes: file.size,
    duration,
    width,
    height,
    videoCodec,
    audioCodec,
    hasAudio,
    fps,
    bitrate,
    keyframes,
    isWebCodecsFastPathCompatible,
    containerType,
  };
}
