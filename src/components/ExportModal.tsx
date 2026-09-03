import React, { useEffect, useState } from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Zap,
  Cpu,
  RotateCcw,
  X,
  Clock,
  HardDrive,
} from 'lucide-react';
import type { EngineResult } from '../types';
import { formatBytes } from '../utils';

interface ExportModalProps {
  isOpen: boolean;
  isExporting: boolean;
  progressPercent: number;
  statusText: string;
  result: EngineResult | null;
  errorMessage: string | null;
  engineUsed: 'webcodecs' | 'ffmpeg';
  onClose: () => void;
  onDownload: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  isExporting,
  progressPercent,
  statusText,
  result,
  errorMessage,
  engineUsed,
  onClose,
  onDownload,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (result?.blob) {
      const url = URL.createObjectURL(result.blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [result]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Close Button when not exporting */}
        {!isExporting && (
          <button
            onClick={onClose}
            type="button"
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* State 1: Exporting / Progress */}
        {isExporting && (
          <div className="space-y-6 py-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 animate-pulse">
                {engineUsed === 'webcodecs' ? (
                  <Zap className="w-8 h-8 fill-amber-400 text-amber-400" />
                ) : (
                  <Cpu className="w-8 h-8 text-indigo-400" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">กำลังประมวลผลวิดีโอ...</h3>
              <p className="text-xs text-slate-400">{statusText}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>
                  {engineUsed === 'webcodecs' ? '⚡ ตัดต่อด่วนพิเศษ (ความเร็วสูง)' : '🔧 กำลังรวมและจัดรูปแบบวิดีโอ'}
                </span>
                <span className="font-bold text-indigo-400">{progressPercent}%</span>
              </div>
            </div>
          </div>
        )}

        {/* State 2: Error */}
        {!isExporting && errorMessage && (
          <div className="space-y-5 py-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">ไม่สามารถบันทึกวิดีโอได้</h3>
              <p className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-left">
                {errorMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors"
            >
              ปิดและกลับไปแก้ไข
            </button>
          </div>
        )}

        {/* State 3: Success Result */}
        {!isExporting && result && (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">บันทึกวิดีโอเสร็จเรียบร้อย!</h3>
              <p className="text-xs text-slate-400">วิดีโอของคุณพร้อมให้ดาวน์โหลดลงเครื่องแล้ว</p>
            </div>

            {/* Video Result Preview */}
            {previewUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video max-h-48 flex items-center justify-center">
                <video src={previewUrl} controls className="w-full h-full object-contain" />
              </div>
            )}

            {/* Performance & File Metrics */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-slate-400 flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>ใช้เวลาเพียง</span>
                </div>
                <div className="font-semibold text-white">
                  {(result.processingTimeMs / 1000).toFixed(2)} วินาที{' '}
                  <span className="text-[10px] text-amber-400">
                    ({result.engine === 'webcodecs' ? '⚡ ด่วนพิเศษ' : '🔧 รวมละเอียด'})
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-slate-400 flex items-center gap-1 mb-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>ขนาดไฟล์วิดีโอ</span>
                </div>
                <div className="font-semibold text-white">
                  {formatBytes(result.blob.size)}
                </div>
              </div>
            </div>

            {/* Download and Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={onDownload}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดวิดีโอลงเครื่อง</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>กลับไปแก้ไข</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
