import React from 'react';
import { ShieldCheck, Cookie, Check, X, AlertCircle } from 'lucide-react';

interface AdConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onClose?: () => void;
}

export const AdConsentModal: React.FC<AdConsentModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-consent-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 text-left">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ad-consent-title" className="text-sm sm:text-base font-bold text-white">
                การยินยอมการแสดงโฆษณาและความเป็นส่วนตัว
              </h2>
              <span className="text-[11px] text-slate-400">
                Google AdSense &amp; Cookie Consent
              </span>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="ปิด"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            เว็บไซต์ <strong className="text-white">ตัดคลิปไว</strong> ให้บริการตัดต่อและรวมวิดีโอฟรี 100% ไม่มีลายน้ำ โดยเราได้รับการสนับสนุนค่าใช้จ่ายในการดำเนินงานผ่านโฆษณาจาก <strong className="text-white">Google AdSense</strong>
          </p>

          <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-start gap-2 text-[11px] text-emerald-300">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>
                <strong className="text-white">วิดีโอปลอดภัย 100%:</strong> ไฟล์วิดีโอของคุณจะถูกประมวลผลอยู่ภายในเครื่องของคุณเท่านั้น ไม่มีการส่งหรืออัปโหลดไฟล์ขึ้นเซิร์ฟเวอร์
              </span>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-slate-300 border-t border-slate-900 pt-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />
              <span>
                <strong className="text-white">คุกกี้โฆษณา:</strong> Google และพาร์ทเนอร์อาจใช้คุกกี้ในการนำเสนอโฆษณาที่เหมาะสมกับคุณ หรือเลือกแสดงเฉพาะโฆษณาทั่วไปได้
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>ยินยอมและใช้งานต่อ (แนะนำ)</span>
          </button>

          <button
            type="button"
            onClick={onDecline}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition-colors border border-slate-700 text-center"
          >
            ปฏิเสธ / แสดงเฉพาะโฆษณาทั่วไป
          </button>
        </div>
      </div>
    </div>
  );
};
