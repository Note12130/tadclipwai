import React from 'react';
import { Crop, FileType, Check } from 'lucide-react';
import type { VideoMetadata } from '../types';

export type AspectRatioPreset = 'original' | '16:9' | '9:16' | '1:1' | '4:3';
export type OutputFormat = 'mp4' | 'webm' | 'mov';

interface CropControlsProps {
  metadata?: VideoMetadata | null;
  selectedRatio: AspectRatioPreset;
  selectedFormat: OutputFormat;
  onSelectRatio: (ratio: AspectRatioPreset) => void;
  onSelectFormat: (format: OutputFormat) => void;
}

export const CropControls: React.FC<CropControlsProps> = ({
  metadata,
  selectedRatio,
  selectedFormat,
  onSelectRatio,
  onSelectFormat,
}) => {
  const origW = metadata?.width || 1920;
  const origH = metadata?.height || 1080;

  // Calculate target cropped resolution
  const getTargetResolution = (ratio: AspectRatioPreset) => {
    if (ratio === 'original') return `${origW}×${origH}`;
    if (ratio === '16:9') {
      const targetH = Math.round((origW * 9) / 16);
      return targetH <= origH ? `${origW}×${targetH}` : `${Math.round((origH * 16) / 9)}×${origH}`;
    }
    if (ratio === '9:16') {
      const targetW = Math.round((origH * 9) / 16);
      return `${Math.min(origW, targetW)}×${origH}`;
    }
    if (ratio === '1:1') {
      const side = Math.min(origW, origH);
      return `${side}×${side}`;
    }
    if (ratio === '4:3') {
      const targetH = Math.round((origW * 3) / 4);
      return targetH <= origH ? `${origW}×${targetH}` : `${Math.round((origH * 4) / 3)}×${origH}`;
    }
    return `${origW}×${origH}`;
  };

  const ratios: { id: AspectRatioPreset; label: string; desc: string }[] = [
    { id: 'original', label: 'ขนาดเดิม', desc: 'ไม่ตัดขอบภาพ' },
    { id: '9:16', label: '9:16 แนวตั้ง', desc: 'TikTok, Reels, Shorts' },
    { id: '16:9', label: '16:9 แนวนอน', desc: 'YouTube, ทีวี, จอคอม' },
    { id: '1:1', label: '1:1 สี่เหลี่ยม', desc: 'โพสต์รูป Instagram/FB' },
    { id: '4:3', label: '4:3 คลาสสิก', desc: 'ขนาดวิดีโอทั่วไป' },
  ];

  const formats: { id: OutputFormat; label: string; codec: string }[] = [
    { id: 'mp4', label: 'MP4', codec: 'แนะนำ • เปิดได้ทุกอุปกรณ์ทั้งมือถือและคอม' },
    { id: 'webm', label: 'WebM', codec: 'ขนาดไฟล์กะทัดรัด ประหยัดพื้นที่' },
    { id: 'mov', label: 'MOV', codec: 'เหมาะสำหรับ iPhone, iPad และ Mac' },
  ];

  return (
    <div className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 p-4 sm:p-5 shadow-xl backdrop-blur-sm space-y-5">
      {/* Aspect Ratio Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Crop className="w-4 h-4 text-indigo-400" />
            <span>ปรับขนาดภาพสำหรับโซเชียลมีเดีย</span>
          </label>
          <span className="text-[11px] font-mono text-indigo-300">
            ขนาดภาพ: {getTargetResolution(selectedRatio)} พิกเซล
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ratios.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRatio(r.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedRatio === r.id
                  ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{r.label}</span>
                {selectedRatio === r.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Output Format Section */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <FileType className="w-4 h-4 text-indigo-400" />
          <span>ประเภทไฟล์วิดีโอ</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {formats.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelectFormat(f.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedFormat === f.id
                  ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase">.{f.label}</span>
                {selectedFormat === f.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{f.codec}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
