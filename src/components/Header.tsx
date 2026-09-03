import React from 'react';
import { Scissors, ShieldCheck, BarChart3 } from 'lucide-react';
import type { EnvironmentSupport } from '../types';

interface HeaderProps {
  env: EnvironmentSupport;
  onOpenBenchmark?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBenchmark }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: App Brand & Friendly Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">ตัดคลิปไว</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>ปลอดภัย 100%</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              ตัดต่อวิดีโอในเครื่องของคุณทันที • ไม่ต้องอัปโหลดไฟล์ไปที่ใด
            </p>
          </div>
        </div>

        {/* Right: Friendly Security Guarantee & Optional Stats */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span>🔒 วิดีโอของคุณจะไม่ถูกส่งออกจากเครื่อง</span>
          </div>

          {onOpenBenchmark && (
            <button
              type="button"
              onClick={onOpenBenchmark}
              className="px-3 py-1.5 rounded-xl border border-slate-700 hover:border-indigo-500/60 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="ดูสถิติการใช้งาน"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">สถิติ</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
