import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileVideo, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { validateVideoFile } from '../utils/validation';
import type { ValidationResult } from '../types';

interface FileDropZoneProps {
  onFileAccepted?: (file: File, validation: ValidationResult) => void;
  onFilesAccepted?: (files: File[]) => void;
  isProcessing?: boolean;
  processingStatus?: string;
  compact?: boolean;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFileAccepted,
  onFilesAccepted,
  isProcessing = false,
  processingStatus = 'กำลังโหลดและอ่านข้อมูลวิดีโอ...',
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMultipleFiles = useCallback(
    (fileList: FileList | File[]) => {
      setErrorMessage(null);
      setWarningMessage(null);

      const files = Array.from(fileList);
      if (files.length === 0) return;

      const validFiles: File[] = [];
      const warnings: string[] = [];

      for (const file of files) {
        const validation = validateVideoFile(file);
        if (!validation.isValid) {
          setErrorMessage(validation.error || `ไฟล์ "${file.name}" ไม่ถูกต้อง`);
          return;
        }
        if (validation.warning) {
          warnings.push(validation.warning);
        }
        validFiles.push(file);
      }

      if (warnings.length > 0) {
        setWarningMessage(warnings[0]);
      }

      if (onFilesAccepted) {
        onFilesAccepted(validFiles);
      } else if (onFileAccepted && validFiles.length > 0) {
        onFileAccepted(validFiles[0], validateVideoFile(validFiles[0]));
      }
    },
    [onFileAccepted, onFilesAccepted]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleMultipleFiles(files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleMultipleFiles(files);
    }
    e.target.value = '';
  };

  const openPicker = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  if (compact) {
    return (
      <div className="w-full space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.mov,.webm,.mkv,.avi"
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openPicker}
          className={`relative group border-2 border-dashed rounded-xl p-4 transition-all duration-200 cursor-pointer text-center select-none ${
            isDragging
              ? 'border-indigo-400 bg-indigo-500/15 scale-[1.01]'
              : 'border-slate-800 hover:border-indigo-500/60 bg-slate-950/60 hover:bg-slate-900/60'
          } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
        >
          <div className="flex flex-col items-center gap-2">
            {isProcessing ? (
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isDragging
                    ? 'bg-indigo-500 text-white'
                    : 'bg-indigo-500/10 text-indigo-400 group-hover:scale-105'
                }`}
              >
                {isDragging ? <FileVideo className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
              </div>
            )}

            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-white">
                {isProcessing
                  ? processingStatus
                  : isDragging
                  ? 'ปล่อยวิดีโอที่นี่'
                  : 'ลากวิดีโอมาวาง หรือคลิกเพื่อเลือกไฟล์'}
              </div>
              <p className="text-[11px] text-slate-400">เลือกได้หลายวิดีโอพร้อมกัน (MP4, MOV, WebM)</p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.mov,.webm,.mkv,.avi"
        multiple
        onChange={handleInputChange}
        className="hidden"
        disabled={isProcessing}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openPicker}
        className={`relative group border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all duration-200 cursor-pointer text-center select-none ${
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01] shadow-2xl shadow-indigo-500/10'
            : 'border-slate-800 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/60 shadow-xl'
        } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
      >
        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                isDragging
                  ? 'bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/30'
                  : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105'
              }`}
            >
              {isDragging ? <FileVideo className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
            </div>
          )}

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-semibold text-white">
              {isProcessing
                ? processingStatus
                : isDragging
                ? 'ปล่อยวิดีโอที่นี่เพื่อเริ่มใช้งาน'
                : 'ลากวิดีโอมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์'}
            </h3>
            <p className="text-xs sm:text-sm text-indigo-300 font-medium">
              ✨ เลือกได้หลายวิดีโอพร้อมกัน
            </p>
            <p className="text-[11px] text-slate-400">
              รองรับไฟล์วิดีโอทั่วไป (MP4, MOV, WebM) • ปลอดภัย วิดีโอไม่ถูกส่งออกจากเครื่อง
            </p>
          </div>

          {!isProcessing && (
            <button
              type="button"
              className="mt-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 active:scale-95 flex items-center gap-2"
            >
              <span>เลือกวิดีโอ (เลือกได้หลายไฟล์พร้อมกัน)</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">ข้อผิดพลาด: </span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Warning Banner */}
      {warningMessage && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-300 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">ข้อควรทราบ: </span>
            {warningMessage}
          </div>
        </div>
      )}
    </div>
  );
};
