import React, { useRef, useCallback } from 'react';
import { Zap, Cpu, Film, Scissors } from 'lucide-react';
import type { KeyframeInfo, VideoMetadata } from '../types';
import { formatDuration } from '../utils';
import { snapToPrecedingKeyframe } from '../engine/webcodecs/fastTrim';

export interface TimelineClip {
  id: string;
  file: File;
  metadata: VideoMetadata;
  startSeconds: number;
  endSeconds: number;
}

export interface TimelineProps {
  // Multi-clip project props
  clips?: TimelineClip[];
  activeClipId?: string;
  onSelectClip?: (id: string) => void;
  onUpdateClipTrim?: (clipId: string, start: number, end: number) => void;
  onSeekProject?: (projectTime: number) => void;
  projectTime?: number;
  totalDuration?: number;

  // Single-clip fallback props (for backwards compatibility)
  duration?: number;
  currentTime?: number;
  startSeconds?: number;
  endSeconds?: number;
  keyframes?: KeyframeInfo[];
  snapToKeyframe: boolean;
  onRangeChange?: (start: number, end: number) => void;
  onSeek?: (time: number) => void;
  onToggleSnap: (enabled: boolean) => void;
  isFastPathEligible: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({
  clips,
  activeClipId,
  onSelectClip,
  onUpdateClipTrim,
  onSeekProject,
  projectTime,
  totalDuration,

  duration = 10,
  currentTime = 0,
  startSeconds = 0,
  endSeconds = 10,
  keyframes = [],
  snapToKeyframe,
  onRangeChange,
  onSeek,
  onToggleSnap,
  isFastPathEligible,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Use multi-clip mode if clips list is provided and has items
  const isMultiClip = Boolean(clips && clips.length > 0);

  // Calculate cumulative clip timeline ranges for multi-clip mode
  const multiClipRanges = React.useMemo(() => {
    if (!clips || clips.length === 0) return [];
    let accumulated = 0;
    return clips.map((c, i) => {
      const clipDuration = Math.max(0.2, c.endSeconds - c.startSeconds);
      const projectStart = accumulated;
      const projectEnd = accumulated + clipDuration;
      accumulated += clipDuration;
      return {
        clip: c,
        index: i,
        clipDuration,
        projectStart,
        projectEnd,
      };
    });
  }, [clips]);

  const effectiveTotalDuration = React.useMemo(() => {
    if (isMultiClip) {
      if (totalDuration !== undefined && totalDuration > 0) return totalDuration;
      const last = multiClipRanges[multiClipRanges.length - 1];
      return last ? last.projectEnd : 1;
    }
    return duration > 0 ? duration : 1;
  }, [isMultiClip, totalDuration, multiClipRanges, duration]);

  const effectiveCurrentTime = projectTime !== undefined ? projectTime : currentTime;

  // Convert mouse/touch event on track to seconds
  const getProjectTimeFromEvent = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const ratio = clickX / rect.width;
      return ratio * effectiveTotalDuration;
    },
    [effectiveTotalDuration]
  );

  // Direct track click to seek across the project sequence
  const handleTrackClick = (e: React.MouseEvent) => {
    const time = getProjectTimeFromEvent(e.clientX);
    if (isMultiClip && onSeekProject) {
      onSeekProject(time);
    } else if (onSeek) {
      onSeek(time);
    }
  };

  // Dragging start handle of the active clip
  const handleStartDrag = (
    e: React.MouseEvent | React.TouchEvent,
    targetClip: TimelineClip
  ) => {
    e.stopPropagation();
    const clipKeyframes = targetClip.metadata.keyframes || [];

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      if (!trackRef.current) return;

      const pTime = getProjectTimeFromEvent(clientX);

      // Find range of this clip
      const range = multiClipRanges.find(r => r.clip.id === targetClip.id);
      const clipProjectStart = range ? range.projectStart : 0;
      const offsetInClip = pTime - clipProjectStart;
      let newStart = targetClip.startSeconds + offsetInClip;

      if (snapToKeyframe && clipKeyframes.length > 0) {
        newStart = snapToPrecedingKeyframe(newStart, clipKeyframes);
      }

      // Constrain: 0 <= newStart <= endSeconds - 0.3s
      newStart = Math.max(0, Math.min(targetClip.endSeconds - 0.3, newStart));

      if (onUpdateClipTrim) {
        onUpdateClipTrim(targetClip.id, newStart, targetClip.endSeconds);
      } else if (onRangeChange) {
        onRangeChange(newStart, targetClip.endSeconds);
      }

      if (range && onSeekProject) {
        onSeekProject(range.projectStart);
      }
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
  };

  // Dragging end handle of the active clip
  const handleEndDrag = (
    e: React.MouseEvent | React.TouchEvent,
    targetClip: TimelineClip
  ) => {
    e.stopPropagation();

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      if (!trackRef.current) return;

      const pTime = getProjectTimeFromEvent(clientX);

      const range = multiClipRanges.find(r => r.clip.id === targetClip.id);
      const clipProjectStart = range ? range.projectStart : 0;
      const offsetInClip = pTime - clipProjectStart;
      let newEnd = targetClip.startSeconds + offsetInClip;

      // Constrain: startSeconds + 0.3s <= newEnd <= metadata.duration
      const maxDuration = targetClip.metadata.duration || 9999;
      newEnd = Math.min(maxDuration, Math.max(targetClip.startSeconds + 0.3, newEnd));

      if (onUpdateClipTrim) {
        onUpdateClipTrim(targetClip.id, targetClip.startSeconds, newEnd);
      } else if (onRangeChange) {
        onRangeChange(targetClip.startSeconds, newEnd);
      }

      if (range && onSeekProject) {
        onSeekProject(range.projectStart + (newEnd - targetClip.startSeconds));
      }
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
  };

  const playheadPercent =
    effectiveTotalDuration > 0
      ? Math.min(100, Math.max(0, (effectiveCurrentTime / effectiveTotalDuration) * 100))
      : 0;

  const currentActiveClip = isMultiClip
    ? clips?.find(c => c.id === activeClipId) || clips?.[0]
    : null;

  return (
    <div className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 p-3 sm:p-4 shadow-xl backdrop-blur-sm space-y-3 select-none">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-white">
            {isMultiClip
              ? `ไทม์ไลน์วิดีโอ (${clips?.length} คลิปเรียงต่อกัน)`
              : 'ไทม์ไลน์การตัดต่อ'}
          </span>
          <span className="font-mono text-amber-300 font-bold ml-1">
            {formatDuration(effectiveCurrentTime)} / {formatDuration(effectiveTotalDuration)}
          </span>
          {currentActiveClip && (
            <span className="text-[11px] text-slate-400 hidden md:inline-flex items-center gap-1">
              <Scissors className="w-3 h-3 text-indigo-400" />
              <span>
                กำลังเลือกคลิป:{' '}
                <strong className="text-slate-200 truncate max-w-[160px]">
                  {currentActiveClip.file.name}
                </strong>
              </span>
            </span>
          )}
        </div>

        {/* Snap-to-Keyframe Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSnap(!snapToKeyframe)}
            className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-medium ${
              snapToKeyframe && isFastPathEligible
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-sm shadow-amber-500/10'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="ตัดตรงตำแหน่ง Keyframe เพื่อความเร็วระดับมิลลิวินาที"
          >
            {snapToKeyframe && isFastPathEligible ? (
              <>
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>โหมดตัดด่วนพิเศษ ⚡ (เร็วมาก)</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>โหมดตัดละเอียด 🎯 (ทุกจุด)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Multi-Clip Horizontal Timeline Track */}
      <div className="relative pt-6 pb-2">
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative h-16 rounded-xl bg-slate-950 border border-slate-800/90 cursor-pointer overflow-hidden shadow-inner group flex items-stretch"
        >
          {/* Multi-Clip Blocks rendered side-by-side */}
          {isMultiClip ? (
            multiClipRanges.map(range => {
              const { clip, index, clipDuration, projectStart } = range;
              const isActive = clip.id === activeClipId;
              const widthPct =
                effectiveTotalDuration > 0
                  ? (clipDuration / effectiveTotalDuration) * 100
                  : 0;
              const leftPct =
                effectiveTotalDuration > 0
                  ? (projectStart / effectiveTotalDuration) * 100
                  : 0;

              return (
                <div
                  key={clip.id}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectClip?.(clip.id);
                    if (onSeekProject) onSeekProject(projectStart);
                  }}
                  className={`absolute top-0 bottom-0 border-r border-slate-800/90 p-2 flex flex-col justify-between transition-all group/clip overflow-hidden cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/30 border-y-2 border-indigo-500 shadow-md shadow-indigo-500/10 z-10'
                      : 'bg-slate-900/60 hover:bg-slate-800/70 hover:border-slate-700'
                  }`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`คลิปที่ ${index + 1}: ${clip.file.name} (${clipDuration.toFixed(1)}s)`}
                >
                  {/* Top Bar of Clip Block */}
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <span
                      className={`text-[11px] font-mono font-bold truncate ${
                        isActive ? 'text-indigo-200' : 'text-slate-300'
                      }`}
                    >
                      #{index + 1} {clip.file.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/70 text-slate-400 flex-shrink-0">
                      {clipDuration.toFixed(1)}s
                    </span>
                  </div>

                  {/* Bottom Time Range Info */}
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    ✂️ {formatDuration(clip.startSeconds)} – {formatDuration(clip.endSeconds)}
                  </div>

                  {/* Active Clip Left Trim Handle (Start) */}
                  {isActive && (
                    <div
                      onMouseDown={e => handleStartDrag(e, clip)}
                      onTouchStart={e => handleStartDrag(e, clip)}
                      className="absolute top-0 bottom-0 left-0 w-4 flex items-center justify-center cursor-ew-resize z-30 group/handle"
                      title="ลากเพื่อตัดหัวคลิป"
                    >
                      <div className="w-2.5 h-full rounded-l-md bg-indigo-500 group-hover/handle:bg-indigo-400 flex flex-col items-center justify-center shadow-lg transition-colors">
                        <div className="w-0.5 h-4 bg-white/80 rounded-full" />
                      </div>
                      <div className="absolute -top-6 left-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-indigo-300 whitespace-nowrap pointer-events-none shadow-md">
                        {formatDuration(clip.startSeconds)}
                      </div>
                    </div>
                  )}

                  {/* Active Clip Right Trim Handle (End) */}
                  {isActive && (
                    <div
                      onMouseDown={e => handleEndDrag(e, clip)}
                      onTouchStart={e => handleEndDrag(e, clip)}
                      className="absolute top-0 bottom-0 right-0 w-4 flex items-center justify-center cursor-ew-resize z-30 group/handle"
                      title="ลากเพื่อตัดท้ายคลิป"
                    >
                      <div className="w-2.5 h-full rounded-r-md bg-indigo-500 group-hover/handle:bg-indigo-400 flex flex-col items-center justify-center shadow-lg transition-colors">
                        <div className="w-0.5 h-4 bg-white/80 rounded-full" />
                      </div>
                      <div className="absolute -top-6 right-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-indigo-300 whitespace-nowrap pointer-events-none shadow-md">
                        {formatDuration(clip.endSeconds)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            /* Single-clip fallback representation */
            <>
              {keyframes.map((kf, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-[1px] bg-slate-800/80 pointer-events-none"
                  style={{ left: `${(kf.timeSeconds / effectiveTotalDuration) * 100}%` }}
                />
              ))}
              <div
                className="absolute top-0 bottom-0 bg-indigo-500/20 border-y-2 border-indigo-500 pointer-events-none"
                style={{
                  left: `${(startSeconds / effectiveTotalDuration) * 100}%`,
                  width: `${Math.max(0, ((endSeconds - startSeconds) / effectiveTotalDuration) * 100)}%`,
                }}
              />
            </>
          )}

          {/* Continuous Red Playhead moving across all clips */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 pointer-events-none z-30"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="w-3 h-3 rounded-full bg-rose-500 -translate-x-1.25 -translate-y-1 shadow-lg shadow-rose-500/60 ring-2 ring-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
};
