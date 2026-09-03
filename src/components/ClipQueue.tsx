import React, { useRef } from 'react';
import {
  Film,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Zap,
  Cpu,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import type { VideoMetadata } from '../types';
import { formatDuration, formatBytes } from '../utils';

export interface QueueItem {
  id: string;
  file: File;
  metadata: VideoMetadata;
  startSeconds: number;
  endSeconds: number;
}

interface ClipQueueProps {
  queue: QueueItem[];
  activeClipId: string;
  onSelectClip: (id: string) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveItem: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export const ClipQueue: React.FC<ClipQueueProps> = ({
  queue,
  activeClipId,
  onSelectClip,
  onAddFiles,
  onRemoveItem,
  onMoveUp,
  onMoveDown,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Total trimmed output duration across all clips
  const totalTrimmedDuration = queue.reduce(
    (sum, item) => sum + Math.max(0, item.endSeconds - item.startSeconds),
    0
  );

  // Check if all clips have identical formats
  const isSameFormat = (() => {
    if (queue.length <= 1) return true;
    const base = queue[0].metadata;
    return queue.every(
      item =>
        item.metadata.containerType === base.containerType &&
        item.metadata.width === base.width &&
        item.metadata.height === base.height &&
        item.metadata.videoCodec === base.videoCodec
    );
  })();

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onAddFiles(files);
    }
    // reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 p-4 sm:p-5 shadow-xl backdrop-blur-sm space-y-4">
      {/* Header & Add Clip Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>ลำดับคลิปในโปรเจกต์ ({queue.length} คลิป)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              ความยาวรวมหลังตัดทุกคลิป:{' '}
              <strong className="text-indigo-300 font-mono">
                {formatDuration(totalTrimmedDuration)}
              </strong>
            </span>
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.mov,.webm,.mkv"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มคลิปใหม่</span>
        </button>
      </div>

      {/* Format Compatibility Alert */}
      {queue.length > 1 && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
            isSameFormat
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
              : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300'
          }`}
        >
          {isSameFormat ? (
            <>
              <Zap className="w-4 h-4 fill-amber-400 text-amber-400 flex-shrink-0" />
              <span>
                <strong>รูปแบบตรงกันทั้งหมด ⚡</strong> รวมไฟล์และตัดด้วย WebCodecs Fast Path (Stream-copy &lt; 2s)
              </span>
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>
                <strong>รูปแบบหรือความละเอียดแตกต่างกัน 🔧</strong> จะตัดและรวมผ่าน ffmpeg.wasm พร้อม normalize รูปแบบ
              </span>
            </>
          )}
        </div>
      )}

      {/* Clip Sequence List */}
      <div className="space-y-2">
        {queue.map((item, index) => {
          const isActive = item.id === activeClipId;
          const clipDuration = Math.max(0, item.endSeconds - item.startSeconds);
          const isTrimmed =
            item.startSeconds > 0 || item.endSeconds < item.metadata.duration - 0.1;

          return (
            <div
              key={item.id}
              onClick={() => onSelectClip(item.id)}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {index + 1}
                </span>

                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  <Film className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate max-w-[140px] sm:max-w-xs" title={item.file.name}>
                      {item.file.name}
                    </span>
                    {isActive && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>กำลังตัดคลิปนี้</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400 mt-0.5 font-mono">
                    <span className={isTrimmed ? 'text-amber-400 font-medium' : 'text-slate-300'}>
                      ✂️ {formatDuration(item.startSeconds)} – {formatDuration(item.endSeconds)} ({clipDuration.toFixed(1)}s)
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>{item.metadata.width}×{item.metadata.height}</span>
                    <span className="text-slate-600">•</span>
                    <span>{formatBytes(item.file.size)}</span>
                  </div>
                </div>
              </div>

              {/* Right Controls: Reorder and Delete */}
              <div
                className="flex items-center gap-1"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onMoveUp(index)}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  title="เลื่อนคลิปไปข้างหน้า"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown(index)}
                  disabled={index === queue.length - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  title="เลื่อนคลิปไปข้างหลัง"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                {queue.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors ml-1"
                    title="ลบคลิปนี้ออกจากโปรเจกต์"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
