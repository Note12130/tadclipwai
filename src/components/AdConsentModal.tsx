import React from 'react';
import { Cookie, X } from 'lucide-react';

interface AdConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose?: () => void;
}

export const AdConsentModal: React.FC<AdConsentModalProps> = ({
  isOpen,
  onAccept,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleClose = onClose || onAccept;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="แจ้งเตือนการใช้คุกกี้"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-200 select-none"
    >
      {/* Header: Cookie Icon & Close Button (X) */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2 text-indigo-400">
          <Cookie className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-200">นโยบายความเป็นส่วนตัว</span>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="ปิด"
          aria-label="ปิด"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: User Requested Text */}
      <p className="text-xs text-slate-300 leading-relaxed">
        เว็บไซต์นี้ใช้คุกกี้เพื่อสร้างประสบการณ์ที่ดีมีประสิทธิภาพยิ่งขึ้น
      </p>

      {/* Action Button: "รับทราบ" */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onAccept}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-sm active:scale-95 text-center"
        >
          รับทราบ
        </button>
      </div>
    </div>
  );
};
