import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Film,
} from 'lucide-react';
import { formatDuration } from '../utils';

export interface VideoPlayerProps {
  src: string; // Blob URL
  currentTime: number;
  displayCurrentTime?: number;
  displayDuration?: number;
  badgeText?: string;
  isPlaying?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onSeekRelative?: (seconds: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  currentTime,
  displayCurrentTime,
  displayDuration,
  badgeText,
  isPlaying: externalPlaying,
  onPlayStateChange,
  onTimeUpdate,
  onDurationChange,
  onSeekRelative,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [internalPlaying, setInternalPlaying] = useState(false);
  const activePlaying = externalPlaying !== undefined ? externalPlaying : internalPlaying;

  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Sync external currentTime changes (e.g. from timeline scrubber or clip switch)
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.3) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const setPlayback = useCallback(
    (play: boolean) => {
      if (onPlayStateChange) {
        onPlayStateChange(play);
      } else {
        setInternalPlaying(play);
      }
    },
    [onPlayStateChange]
  );

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (activePlaying) {
      videoRef.current.pause();
      setPlayback(false);
    } else {
      videoRef.current.play().catch(console.error);
      setPlayback(true);
    }
  }, [activePlaying, setPlayback]);

  // Sync activePlaying state to actual video element
  useEffect(() => {
    if (!videoRef.current) return;
    if (activePlaying && videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
    } else if (!activePlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [activePlaying]);

  // Auto-resume playback seamlessly when src changes to next clip
  const handleLoadedData = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = currentTime;
    if (activePlaying) {
      videoRef.current.play().catch(console.error);
    }
  }, [currentTime, activePlaying]);

  const seekRelative = useCallback(
    (seconds: number) => {
      if (onSeekRelative) {
        onSeekRelative(seconds);
        return;
      }
      if (!videoRef.current) return;
      const newTime = Math.min(
        videoRef.current.duration || 0,
        Math.max(0, videoRef.current.currentTime + seconds)
      );
      videoRef.current.currentTime = newTime;
      onTimeUpdate?.(newTime);
    },
    [onSeekRelative, onTimeUpdate]
  );

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  // Keyboard Shortcuts (Space: play/pause, ArrowLeft/Right: seek ±5s, M: mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekRelative(-5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekRelative(5);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seekRelative, toggleMute]);

  const effectiveCurrent = displayCurrentTime !== undefined ? displayCurrentTime : currentTime;
  const effectiveDuration = displayDuration !== undefined ? displayDuration : duration;

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 group select-none"
    >
      {/* Video Element */}
      <div className="relative aspect-video flex items-center justify-center bg-slate-950">
        <video
          ref={videoRef}
          src={src}
          playsInline
          onClick={togglePlay}
          onLoadedData={handleLoadedData}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              const dur = videoRef.current.duration || 0;
              setDuration(dur);
              onDurationChange?.(dur);
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              onTimeUpdate?.(videoRef.current.currentTime);
            }
          }}
          onPlay={() => setPlayback(true)}
          onPause={() => {
            // Only update state if not transitioning or ended
            if (!activePlaying) setPlayback(false);
          }}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Top Badge: Mode Indicator (e.g. 🎬 พรีวิวทั้งวิดีโอ) */}
        {badgeText && (
          <div className="absolute top-3 left-3 z-30 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-medium backdrop-blur-md flex items-center gap-1.5 shadow-lg">
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span>{badgeText}</span>
          </div>
        )}

        {/* Center Play Overlay Icon on Pause */}
        {!activePlaying && (
          <button
            onClick={togglePlay}
            type="button"
            className="absolute w-16 h-16 rounded-full bg-slate-900/80 border border-white/20 text-white flex items-center justify-center backdrop-blur-md shadow-2xl hover:scale-110 transition-transform active:scale-95 z-20"
            title="เล่นวิดีโอ"
          >
            <Play className="w-7 h-7 fill-white translate-x-0.5" />
          </button>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="p-3 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-between gap-3 text-white">
        {/* Left Controls: Play/Pause, Rewind, Fast Forward */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={togglePlay}
            type="button"
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            title={activePlaying ? 'หยุดชั่วคราว (Space)' : 'เล่น (Space)'}
          >
            {activePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
          </button>

          <button
            onClick={() => seekRelative(-5)}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="ย้อนกลับ 5 วินาที (←)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => seekRelative(5)}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="ไปข้างหน้า 5 วินาที (→)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Timecode display */}
          <div className="text-xs font-mono text-slate-300 ml-2">
            <span>{formatDuration(effectiveCurrent)}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-slate-400">{formatDuration(effectiveDuration)}</span>
          </div>
        </div>

        {/* Right Controls: Volume slider, Fullscreen */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 group/vol">
            <button
              onClick={toggleMute}
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isMuted ? 'เปิดเสียง (M)' : 'ปิดเสียง (M)'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <button
            onClick={toggleFullscreen}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="เต็มจอ"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
