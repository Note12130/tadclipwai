import React from 'react';
import {
  Film,
  Clock,
  Maximize2,
  Volume2,
  VolumeX,
  Zap,
  Cpu,
  RefreshCw,
  HardDrive,
  Activity,
} from 'lucide-react';
import type { VideoMetadata } from '../types';
import { formatDuration, formatBytes } from '../utils';

interface VideoMetadataCardProps {
  metadata: VideoMetadata;
  isOPFSStaged: boolean;
  onReset: () => void;
}

export const VideoMetadataCard: React.FC<VideoMetadataCardProps> = ({
  metadata,
  isOPFSStaged,
  onReset,
}) => {
  // Calculate aspect ratio string (e.g. 16:9, 9:16, 1:1)
  const getAspectRatio = (w: number, h: number) => {
    if (!w || !h) return '';
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(w, h);
    const rW = w / divisor;
    const rH = h / divisor;
    if ((rW === 16 && rH === 9) || (rW === 9 && rH === 16) || (rW === 4 && rH === 3) || (rW === 1 && rH === 1)) {
      return `${rW}:${rH}`;
    }
    const ratio = (w / h).toFixed(2);
    return `${ratio}:1`;
  };

  const aspectRatio = getAspectRatio(metadata.width, metadata.height);

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-slate-900/60 border border-slate-800 p-5 sm:p-6 shadow-2xl backdrop-blur-sm space-y-5">
      {/* Top Header: File Name & Change Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white truncate" title={metadata.name}>
              {metadata.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{formatBytes(metadata.sizeBytes)}</span>
              <span>•</span>
              <span className="uppercase font-mono">{metadata.containerType}</span>
              {isOPFSStaged && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-cyan-400">
                    <HardDrive className="w-3 h-3" />
                    OPFS Staged
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onReset}
          type="button"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="เปลี่ยนไฟล์ใหม่"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">เปลี่ยนไฟล์</span>
        </button>
      </div>

      {/* Engine Routing / Capability Badge */}
      <div className="p-3 rounded-xl border flex items-center gap-3 transition-colors bg-slate-950/40 border-slate-800">
        {metadata.isWebCodecsFastPathCompatible ? (
          <>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span>WebCodecs Fast Path พร้อมใช้งาน ⚡</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ตัดต่อแบบ Keyframe และรวมไฟล์ได้ทันทีโดยไม่ต้อง re-encode (เร็วกว่าปกติ 10-30 เท่า)
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <span>ffmpeg.wasm Engine Required 🔧</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ไฟล์รูปแบบนี้จะประมวลผลผ่าน ffmpeg.wasm รองรับ filter และ frame-accurate encoding ครบถ้วน
              </p>
            </div>
          </>
        )}
      </div>

      {/* Metadata Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>ความยาว</span>
          </div>
          <div className="text-sm font-semibold text-white">
            {formatDuration(metadata.duration)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>ความละเอียด</span>
          </div>
          <div className="text-sm font-semibold text-white">
            {metadata.width && metadata.height
              ? `${metadata.width}×${metadata.height}`
              : 'N/A'}
            {aspectRatio && <span className="text-[10px] text-slate-400 ml-1">({aspectRatio})</span>}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>Video Codec</span>
          </div>
          <div className="text-sm font-semibold text-white truncate" title={metadata.videoCodec || 'Unknown'}>
            {metadata.videoCodec || 'Unknown'}
            {metadata.fps ? <span className="text-[10px] text-slate-400 ml-1">@{metadata.fps}fps</span> : ''}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            {metadata.hasAudio ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>เสียง (Audio)</span>
          </div>
          <div className="text-sm font-semibold text-white truncate" title={metadata.audioCodec || 'No audio'}>
            {metadata.hasAudio ? metadata.audioCodec || 'มีเสียง' : 'ไม่มีเสียง'}
          </div>
        </div>
      </div>
    </div>
  );
};
