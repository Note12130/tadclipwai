/**
 * capabilities.ts
 * Feature detection for WebCodecs and browser hardware acceleration capabilities.
 */

export interface WebCodecsCapabilities {
  hasWebCodecs: boolean;
  hasVideoDecoder: boolean;
  hasVideoEncoder: boolean;
  hasAudioDecoder: boolean;
  hasAudioEncoder: boolean;
  supportedVideoCodecs: string[];
}

let cachedCapabilities: WebCodecsCapabilities | null = null;

/**
 * Checks whether the current browser environment supports the WebCodecs API.
 */
export function isWebCodecsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'VideoDecoder' in window &&
    'VideoEncoder' in window
  );
}

/**
 * Probes browser for supported video codecs via VideoEncoder.isConfigSupported()
 */
export async function detectWebCodecsCapabilities(): Promise<WebCodecsCapabilities> {
  if (cachedCapabilities) {
    return cachedCapabilities;
  }

  const hasVideoDecoder = typeof window !== 'undefined' && 'VideoDecoder' in window;
  const hasVideoEncoder = typeof window !== 'undefined' && 'VideoEncoder' in window;
  const hasAudioDecoder = typeof window !== 'undefined' && 'AudioDecoder' in window;
  const hasAudioEncoder = typeof window !== 'undefined' && 'AudioEncoder' in window;
  const hasWebCodecs = hasVideoDecoder && hasVideoEncoder;

  const supportedVideoCodecs: string[] = [];

  if (hasVideoEncoder && typeof VideoEncoder !== 'undefined' && VideoEncoder.isConfigSupported) {
    const candidateCodecs = [
      'avc1.42001E', // H.264 Baseline
      'avc1.4D401E', // H.264 Main
      'avc1.64001E', // H.264 High
      'vp09.00.10.08', // VP9
      'vp8',
      'av01.0.04M.08', // AV1
      'hev1.1.6.L93.B0', // H.265 / HEVC
    ];

    for (const codec of candidateCodecs) {
      try {
        const support = await VideoEncoder.isConfigSupported({
          codec,
          width: 1280,
          height: 720,
          bitrate: 2_000_000,
          framerate: 30,
        });
        if (support && support.supported) {
          supportedVideoCodecs.push(codec);
        }
      } catch {
        // Codec not supported or check threw
      }
    }
  }

  cachedCapabilities = {
    hasWebCodecs,
    hasVideoDecoder,
    hasVideoEncoder,
    hasAudioDecoder,
    hasAudioEncoder,
    supportedVideoCodecs,
  };

  return cachedCapabilities;
}
