import { useState, useEffect } from 'react';
import type { EnvironmentSupport } from '../types';

export function useEnvironment(): EnvironmentSupport {
  const [env, setEnv] = useState<EnvironmentSupport>({
    isCrossOriginIsolated: false,
    hasSharedArrayBuffer: false,
    hasWebCodecs: false,
    hasVideoDecoder: false,
    hasVideoEncoder: false,
    hasAudioDecoder: false,
    hasAudioEncoder: false,
    hasOPFS: false,
  });

  useEffect(() => {
    const isCrossOriginIsolated = typeof window !== 'undefined' && Boolean(window.crossOriginIsolated);
    const hasSharedArrayBuffer = typeof window !== 'undefined' && typeof window.SharedArrayBuffer !== 'undefined';
    const hasVideoDecoder = typeof window !== 'undefined' && 'VideoDecoder' in window;
    const hasVideoEncoder = typeof window !== 'undefined' && 'VideoEncoder' in window;
    const hasAudioDecoder = typeof window !== 'undefined' && 'AudioDecoder' in window;
    const hasAudioEncoder = typeof window !== 'undefined' && 'AudioEncoder' in window;
    const hasWebCodecs = hasVideoDecoder && hasVideoEncoder;
    const hasOPFS = typeof navigator !== 'undefined' && Boolean(navigator.storage?.getDirectory);

    setEnv({
      isCrossOriginIsolated,
      hasSharedArrayBuffer,
      hasWebCodecs,
      hasVideoDecoder,
      hasVideoEncoder,
      hasAudioDecoder,
      hasAudioEncoder,
      hasOPFS,
    });
  }, []);

  return env;
}
