import React from 'react';
import { AlertTriangle, Play, X } from 'lucide-react';
import type { DevicePerformanceProfile } from '../hooks/useDevicePerformance';

interface LowEndWarningModalProps {
  isOpen: boolean;
  profile: DevicePerformanceProfile;
  fileSizeBytes: number;
  onProceed: () => void;
  onCancel: () => void;
}

export const LowEndWarningModal: React.FC<LowEndWarningModalProps> = ({
  isOpen,
  fileSizeBytes,
  onProceed,
  onCancel,
}) => {
  if (!isOpen) return null;

  const fileSizeMb = Math.round(fileSizeBytes / (1024 * 1024));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/30 p-6 sm:p-7 shadow-2xl space-y-5 text-left">
        <button
          onClick={onCancel}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">แจ้งเตือนก่อนเริ่มบันทึก</h3>
            <p className="text-xs text-amber-300/90 font-medium">
              วิดีโอมีขนาดใหญ่ อาจใช้เวลาประมวลผลสักครู่
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs text-slate-300">
          <p>
            วิดีโอของคุณมีขนาดรวมประมาณ <strong>{fileSizeMb} MB</strong>
          </p>
          <p className="text-[11px] text-slate-400">
            เนื่องจากมีการปรับแต่งที่ต้องคำนวณรายละเอียดสูง เครื่องของคุณอาจทำงานหนักขึ้นชั่วคราวขณะบันทึกวิดีโอ
          </p>
          <p className="text-[11px] text-amber-400/90 pt-1 font-medium">
            💡 แนะนำ: กรุณาอย่าปิดแท็บเบราว์เซอร์จนกว่าจะบันทึกเสร็จสิ้น
          </p>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onProceed}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>เริ่มบันทึกวิดีโอ</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors flex items-center justify-center"
          >
            <span>กลับไปแก้ไข</span>
          </button>
        </div>
      </div>
    </div>
  );
};
