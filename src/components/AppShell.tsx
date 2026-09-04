import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './Header';
import { FileDropZone } from './FileDropZone';
import { VideoPlayer } from './VideoPlayer';
import { Timeline } from './Timeline';
import { CropControls, type AspectRatioPreset, type OutputFormat } from './CropControls';
import { ExportModal } from './ExportModal';
import { BenchmarkModal } from './BenchmarkModal';
import { LowEndWarningModal } from './LowEndWarningModal';
import { AdConsentModal } from './AdConsentModal';
import { useEnvironment } from '../hooks/useEnvironment';
import { useDevicePerformance, shouldWarnBeforeSlowOperation } from '../hooks/useDevicePerformance';
import { OPFSManager } from '../utils/opfs';
import { extractVideoMetadata } from '../engine/metadata';
import { EngineExecutor } from '../engine/executor';
import { EngineRouter } from '../engine/router';
import { TelemetryManager } from '../utils/telemetry';
import { BlobRegistry } from '../utils/blobRegistry';
import {
  computeSequenceTimeline,
  mapProjectTimeToClip,
  mapClipTimeToProjectTime,
} from '../utils/sequencePreview';
import type { QueueItem } from './ClipQueue';
import type { OperationDescriptor, EngineResult } from '../types';
import {
  Scissors,
  Crop,
  Download,
  Zap,
  Film,
  Eye,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  FolderOpen,
  Cpu,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { formatDuration, formatBytes } from '../utils';

export const AppShell: React.FC = () => {
  const env = useEnvironment();

  // Multi-Clip Project State
  const [clipQueue, setClipQueue] = useState<QueueItem[]>([]);
  const [activeClipId, setActiveClipId] = useState<string>('');

  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // Playback & Timeline State for active clip
  const [currentTime, setCurrentTime] = useState(0);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [snapToKeyframe, setSnapToKeyframe] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sequence Preview Mode State: 'clip' (edit in/out trim) vs 'sequence' (realistic composite preview)
  const [previewMode, setPreviewMode] = useState<'clip' | 'sequence'>('sequence');
  const [projectTime, setProjectTime] = useState(0);

  // Left Panel Sub-tab: 'media' (clips list & import) vs 'inspector' (crop & format settings)
  const [leftTab, setLeftTab] = useState<'media' | 'inspector'>('media');

  // Crop & Format State
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioPreset>('original');
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>('mp4');

  // Export Flow State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const [exportResult, setExportResult] = useState<EngineResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Device Performance & Diagnostics Modal State
  const devicePerf = useDevicePerformance();
  const [isLowEndWarningOpen, setIsLowEndWarningOpen] = useState(false);
  const [fileLoadError, setFileLoadError] = useState<string | null>(null);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);

  // Google AdSense & Privacy Consent State
  const [isAdConsentOpen, setIsAdConsentOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tadclipwai_ad_consent') === null;
    }
    return false;
  });

  const handleAcceptAdConsent = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tadclipwai_ad_consent', 'accepted');
      try {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.requestNonPersonalizedAds = 0;
      } catch {
        // ignore
      }
    }
    setIsAdConsentOpen(false);
  }, []);

  // Compute composite sequence timeline math
  const sequenceTimeline = useMemo(() => {
    return computeSequenceTimeline(clipQueue);
  }, [clipQueue]);

  // Current active clip object
  const activeClip = useMemo(() => {
    return clipQueue.find(c => c.id === activeClipId) || clipQueue[0] || null;
  }, [clipQueue, activeClipId]);

  // Sync active clip video blob URL for preview
  useEffect(() => {
    if (activeClip) {
      const url = BlobRegistry.createUrl(activeClip.file, 'preview-video');
      setVideoBlobUrl(url);
    } else {
      BlobRegistry.revokeByTag('preview-video');
      setVideoBlobUrl(null);
    }
  }, [activeClip?.id, activeClip?.file]);

  // Check if all clips have identical formats
  const isSameFormat = useMemo(() => {
    if (clipQueue.length <= 1) return true;
    const base = clipQueue[0].metadata;
    return clipQueue.every(
      item =>
        item.metadata.containerType === base.containerType &&
        item.metadata.width === base.width &&
        item.metadata.height === base.height &&
        item.metadata.videoCodec === base.videoCodec
    );
  }, [clipQueue]);

  // Clean up OPFS staging on reset
  const handleReset = async () => {
    if (activeClip) {
      await OPFSManager.deleteFile(activeClip.file.name);
    }
    BlobRegistry.revokeAll();
    setClipQueue([]);
    setActiveClipId('');
    setProcessingStatus('');
    setCurrentTime(0);
    setProjectTime(0);
    setIsPlaying(false);
    setFileLoadError(null);
    setPreviewMode('sequence');
  };

  // Batch-ingest multiple files at initial load or via drop
  const handleMultipleFilesAccepted = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessingFile(true);
    setFileLoadError(null);

    try {
      const newClips: QueueItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingStatus(`กำลังพักไฟล์ ${i + 1}/${files.length} (${file.name})...`);
        await OPFSManager.writeFile(file.name, file);

        setProcessingStatus(`กำลังวิเคราะห์ข้อมูลวิดีโอ ${i + 1}/${files.length}...`);
        const extracted = await extractVideoMetadata(file);

        const fileDuration = extracted.duration || 10;
        newClips.push({
          id: `clip_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
          file,
          metadata: extracted,
          startSeconds: 0,
          endSeconds: fileDuration,
        });
      }

      setClipQueue(prev => {
        const updated = [...prev, ...newClips];
        if (!activeClipId && updated.length > 0) {
          setActiveClipId(updated[0].id);
          setCurrentTime(0);
        }
        return updated;
      });
    } catch (err: any) {
      console.error('Failed to process video files:', err);
      setFileLoadError(
        'บางไฟล์อาจเสียหายหรือไม่รองรับรูปแบบนี้ กรุณาลองใหม่ด้วยไฟล์ MP4 หรือ WebM อื่น'
      );
      if (clipQueue.length === 0) {
        await handleReset();
      }
    } finally {
      setIsProcessingFile(false);
      setProcessingStatus('');
    }
  };

  const handleRemoveClip = (id: string) => {
    setClipQueue(prev => {
      const filtered = prev.filter(item => item.id !== id);
      if (activeClipId === id && filtered.length > 0) {
        setActiveClipId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleMoveClipUp = (index: number) => {
    if (index === 0) return;
    setClipQueue(prev => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveClipDown = (index: number) => {
    setClipQueue(prev => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Timeline trim range change for active clip
  const handleRangeChange = (start: number, end: number) => {
    if (!activeClip) return;
    setClipQueue(prev =>
      prev.map(c =>
        c.id === activeClip.id ? { ...c, startSeconds: start, endSeconds: end } : c
      )
    );
  };

  // Realistic Sequence Preview: Playhead & Transition Coordinator
  const handleTimeUpdate = useCallback(
    (clipCurrentTime: number) => {
      setCurrentTime(clipCurrentTime);

      if (previewMode === 'sequence' && activeClip) {
        const pTime = mapClipTimeToProjectTime(activeClip.id, clipCurrentTime, sequenceTimeline);
        setProjectTime(pTime);

        // Check if clip reached its configured trim end point
        if (clipCurrentTime >= activeClip.endSeconds - 0.15) {
          const currentIndex = clipQueue.findIndex(c => c.id === activeClip.id);
          if (currentIndex !== -1 && currentIndex < clipQueue.length - 1) {
            // Seamless transition to next clip in sequence!
            const nextClip = clipQueue[currentIndex + 1];
            setActiveClipId(nextClip.id);
            setCurrentTime(nextClip.startSeconds);
          } else if (currentIndex === clipQueue.length - 1) {
            // Reached the end of the entire sequence!
            setIsPlaying(false);
            setProjectTime(sequenceTimeline.totalDuration);
          }
        }
      }
    },
    [previewMode, activeClip, clipQueue, sequenceTimeline]
  );

  // Play/Pause State Handler: Restart from beginning if replayed at the end
  const handlePlayStateChange = (playing: boolean) => {
    if (
      playing &&
      projectTime >= sequenceTimeline.totalDuration - 0.2 &&
      clipQueue.length > 0
    ) {
      handleSeekProject(0);
    }
    setIsPlaying(playing);
  };

  // Seek across composite sequence timeline
  const handleSeekProject = (targetProjectTime: number) => {
    const mapped = mapProjectTimeToClip(targetProjectTime, sequenceTimeline);
    if (!mapped.clipId) return;

    if (mapped.clipId !== activeClipId) {
      setActiveClipId(mapped.clipId);
    }
    setCurrentTime(mapped.clipVideoTime);
    setProjectTime(targetProjectTime);
  };

  // Clean up on app startup & component unmount
  useEffect(() => {
    OPFSManager.cleanStaleTempFiles().catch(console.error);
    return () => {
      BlobRegistry.revokeAll();
      OPFSManager.clearAll().catch(console.error);
    };
  }, []);

  // Determine current active operation descriptor
  const currentOperation: OperationDescriptor = useMemo(() => {
    if (leftTab === 'inspector' && selectedRatio !== 'original') {
      const origW = activeClip?.metadata?.width || 1920;
      const origH = activeClip?.metadata?.height || 1080;
      let cropW = origW;
      let cropH = origH;
      if (selectedRatio === '9:16') {
        cropW = Math.round((origH * 9) / 16);
      } else if (selectedRatio === '1:1') {
        cropW = Math.min(origW, origH);
        cropH = cropW;
      } else if (selectedRatio === '16:9') {
        cropH = Math.round((origW * 9) / 16);
      } else if (selectedRatio === '4:3') {
        cropH = Math.round((origW * 3) / 4);
      }
      const x = Math.max(0, Math.round((origW - cropW) / 2));
      const y = Math.max(0, Math.round((origH - cropH) / 2));

      return {
        type: 'crop',
        x,
        y,
        width: cropW,
        height: cropH,
        targetAspectRatio: selectedRatio,
      };
    }

    if (leftTab === 'inspector' && selectedFormat !== 'mp4') {
      return {
        type: 'convert',
        targetFormat: selectedFormat,
      };
    }

    if (clipQueue.length <= 1) {
      const singleClip = clipQueue[0];
      return {
        type: 'trim',
        startSeconds: singleClip?.startSeconds || 0,
        endSeconds: singleClip?.endSeconds || singleClip?.metadata.duration || 10,
        keyframeAligned: snapToKeyframe,
      };
    }

    return {
      type: 'multiTrimConcat',
      clips: clipQueue.map(c => ({
        startSeconds: c.startSeconds,
        endSeconds: c.endSeconds,
      })),
      keyframeAligned: snapToKeyframe,
      sameFormat: isSameFormat,
    };
  }, [
    leftTab,
    snapToKeyframe,
    clipQueue,
    selectedRatio,
    selectedFormat,
    activeClip,
    isSameFormat,
  ]);

  // Projected engine decision
  const routingDecision = useMemo(() => {
    return EngineRouter.route(currentOperation, activeClip?.metadata, env.hasWebCodecs);
  }, [currentOperation, activeClip?.metadata, env.hasWebCodecs]);

  // Perform actual export execution
  const executeExport = async () => {
    if (clipQueue.length === 0) return;

    setIsLowEndWarningOpen(false);
    setIsExportModalOpen(true);
    setIsExporting(true);
    setExportProgress(0);
    setExportStatusText('กำลังเตรียมข้อมูลคลิป...');
    setExportResult(null);
    setExportError(null);

    try {
      setExportStatusText('กำลังอ่านข้อมูลไฟล์ในโปรเจกต์...');
      const buffers = await Promise.all(clipQueue.map(c => c.file.arrayBuffer()));

      const res = await EngineExecutor.execute({
        operation: currentOperation,
        buffers,
        fileName: clipQueue[0].file.name,
        metadata: activeClip?.metadata,
        onProgress: (percent, status) => {
          setExportProgress(percent);
          setExportStatusText(status);
        },
      });

      setExportResult(res);

      TelemetryManager.recordOperation(
        currentOperation.type,
        res.engine,
        res.processingTimeMs,
        true,
        clipQueue.reduce((sum, c) => sum + c.file.size, 0)
      );
    } catch (err: any) {
      console.error('Export error:', err);
      setExportError(err?.message || 'เกิดข้อผิดพลาดในการประมวลผลวิดีโอ');

      TelemetryManager.recordOperation(
        currentOperation.type,
        routingDecision.engine,
        0,
        false,
        clipQueue.reduce((sum, c) => sum + c.file.size, 0)
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (clipQueue.length === 0) return;
    const totalSize = clipQueue.reduce((sum, c) => sum + c.file.size, 0);

    if (
      shouldWarnBeforeSlowOperation(
        totalSize,
        routingDecision.engine as 'webcodecs' | 'ffmpeg',
        devicePerf
      )
    ) {
      setIsLowEndWarningOpen(true);
    } else {
      executeExport();
    }
  };

  const handleDownload = () => {
    if (!exportResult?.blob) return;
    const url = BlobRegistry.createUrl(exportResult.blob, 'export-download');
    const a = document.createElement('a');
    a.href = url;
    a.download = exportResult.fileName || 'video_cut_export.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => BlobRegistry.revokeUrl(url), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header env={env} onOpenBenchmark={() => setIsBenchmarkModalOpen(true)} />

      {/* Main Studio Workspace: 3-Pane Layout */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-3 sm:p-4 flex flex-col gap-4">
        {fileLoadError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between gap-3">
            <span>{fileLoadError}</span>
            <button
              type="button"
              onClick={() => setFileLoadError(null)}
              className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Top Split Area: Left Media Library & Ingestion vs Right Video Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          {/* ================= SECTION 1: ด้านซ้าย (Media Library & Ingestion) ================= */}
          <section className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 shadow-xl backdrop-blur-sm">
            {/* Panel Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLeftTab('media')}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 ${
                    leftTab === 'media'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>วิดีโอของคุณ ({clipQueue.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeftTab('inspector')}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 ${
                    leftTab === 'inspector'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>ขนาดภาพ & ประเภทไฟล์</span>
                </button>
              </div>

              {clipQueue.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  title="เริ่มโปรเจกต์ใหม่"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Left Sub-View A: Media Ingestion & Clip Queue */}
            {leftTab === 'media' && (
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[480px] pr-1">
                {/* Compact Ingestion DropZone */}
                <FileDropZone
                  compact
                  onFilesAccepted={handleMultipleFilesAccepted}
                  isProcessing={isProcessingFile}
                  processingStatus={processingStatus}
                />

                {/* Queue Summary & Format Badge */}
                {clipQueue.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>ความยาววิดีโอรวมหลังตัด:</span>
                      </span>
                      <strong className="text-indigo-300 font-mono">
                        {formatDuration(sequenceTimeline.totalDuration)}
                      </strong>
                    </div>

                    {clipQueue.length > 1 && (
                      <div
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-[11px] ${
                          isSameFormat
                            ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                            : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300'
                        }`}
                      >
                        {isSameFormat ? (
                          <>
                            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                            <span>วิดีโอเข้ากันได้ดี ⚡ รวมได้ทันทีด้วยความเร็วสูง</span>
                          </>
                        ) : (
                          <>
                            <Cpu className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <span>วิดีโอมีขนาดต่างกัน 🔧 ระบบจะปรับให้พอดีกันอัตโนมัติ</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Clips List */}
                <div className="space-y-2">
                  {clipQueue.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs space-y-1">
                      <Film className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      <p>ยังไม่มีวิดีโอในโปรเจกต์</p>
                      <p className="text-[11px] text-slate-600">
                        เลือกหรือลากวิดีโอมาวางที่ช่องด้านบนเพื่อเริ่มตัดต่อ
                      </p>
                    </div>
                  ) : (
                    clipQueue.map((item, index) => {
                      const isActive = item.id === activeClipId;
                      const clipDuration = Math.max(0, item.endSeconds - item.startSeconds);
                      const isTrimmed =
                        item.startSeconds > 0 || item.endSeconds < item.metadata.duration - 0.1;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setActiveClipId(item.id);
                            if (previewMode === 'sequence') {
                              const range = sequenceTimeline.ranges.find(r => r.id === item.id);
                              if (range) handleSeekProject(range.projectStart);
                            }
                          }}
                          className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                            isActive
                              ? 'bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-500/10'
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 ${
                                isActive
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {index + 1}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="text-xs font-semibold text-white truncate max-w-[130px] sm:max-w-[180px]"
                                  title={item.file.name}
                                >
                                  {item.file.name}
                                </span>
                                {isActive && (
                                  <CheckCircle2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span className={isTrimmed ? 'text-amber-400 font-medium' : 'text-slate-300'}>
                                  ✂️ {formatDuration(item.startSeconds)}–{formatDuration(item.endSeconds)} ({clipDuration.toFixed(1)}s)
                                </span>
                                <span>•</span>
                                <span>{formatBytes(item.file.size)}</span>
                              </div>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-0.5"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleMoveClipUp(index)}
                              disabled={index === 0}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                              title="เลื่อนขึ้น"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveClipDown(index)}
                              disabled={index === clipQueue.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                              title="เลื่อนลง"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            {clipQueue.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveClip(item.id)}
                                className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors ml-0.5"
                                title="ลบวิดีโอนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Left Sub-View B: Inspector Settings (Crop & Format) */}
            {leftTab === 'inspector' && (
              <div className="flex-1 overflow-y-auto pr-1">
                {activeClip ? (
                  <CropControls
                    metadata={activeClip.metadata}
                    selectedRatio={selectedRatio}
                    selectedFormat={selectedFormat}
                    onSelectRatio={setSelectedRatio}
                    onSelectFormat={setSelectedFormat}
                  />
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    เลือกหรือนำเข้าวิดีโอด้านซ้ายเพื่อปรับขนาดภาพและประเภทไฟล์
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ================= SECTION 2: ด้านขวาบน (Video Monitor Preview) ================= */}
          <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 shadow-xl backdrop-blur-sm">
            {/* Monitor Header & Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-white">
                  {previewMode === 'sequence'
                    ? `🎬 ดูวิดีโอทั้งหมดต่อกัน (${formatDuration(sequenceTimeline.totalDuration)})`
                    : activeClip
                    ? `กำลังเลือก: ${activeClip.file.name}`
                    : 'หน้าจอตัวอย่างวิดีโอ'}
                </span>
                {activeClip && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono hidden sm:inline-block">
                    {activeClip.metadata.width}×{activeClip.metadata.height}
                  </span>
                )}
              </div>

              {/* Mode Switcher & Export Trigger */}
              <div className="flex items-center gap-2">
                {clipQueue.length > 0 && (
                  <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewMode('clip');
                        if (activeClip) setCurrentTime(activeClip.startSeconds);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                        previewMode === 'clip'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Scissors className="w-3 h-3" />
                      <span>ตัดคลิปนี้</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPreviewMode('sequence');
                        handleSeekProject(0);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                        previewMode === 'sequence'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>ดูวิดีโอทั้งหมด ({formatDuration(sequenceTimeline.totalDuration)})</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={clipQueue.length === 0}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 active:scale-95"
                >
                  {routingDecision.engine === 'webcodecs' ? (
                    <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {clipQueue.length > 1
                      ? `บันทึกวิดีโอรวม (${clipQueue.length} คลิป)`
                      : 'บันทึกวิดีโอ'}
                  </span>
                </button>
              </div>
            </div>

            {/* Video Player or Empty Screen Monitor */}
            <div className="flex-1 flex items-center justify-center min-h-[300px] sm:min-h-[380px]">
              {activeClip && videoBlobUrl ? (
                <VideoPlayer
                  src={videoBlobUrl}
                  currentTime={currentTime}
                  displayCurrentTime={previewMode === 'sequence' ? projectTime : currentTime}
                  displayDuration={
                    previewMode === 'sequence'
                      ? sequenceTimeline.totalDuration
                      : activeClip.metadata.duration
                  }
                  badgeText={
                    previewMode === 'sequence' && clipQueue.length > 1
                      ? `🎬 ดูวิดีโอทั้งหมดต่อกัน (${formatDuration(sequenceTimeline.totalDuration)})`
                      : undefined
                  }
                  isPlaying={isPlaying}
                  onPlayStateChange={handlePlayStateChange}
                  onTimeUpdate={handleTimeUpdate}
                  onSeekRelative={seconds => {
                    if (previewMode === 'sequence') {
                      handleSeekProject(Math.max(0, projectTime + seconds));
                    } else {
                      setCurrentTime(prev => Math.max(0, prev + seconds));
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full aspect-video rounded-2xl bg-black border border-slate-800 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shadow-inner">
                    <Film className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-400">
                      ยังไม่มีวิดีโอในหน้าจอตัวอย่าง
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm">
                      เลือกหรือลากวิดีโอมาวางที่แถบด้านซ้าย เพื่อเริ่มตัดต่อและเล่นวิดีโอบนหน้าจอนี้
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ================= SECTION 3: ด้านล่าง (Timeline Scrubber Track) ================= */}
        <section className="w-full">
          {clipQueue.length === 0 || !activeClip ? (
            <div className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 p-6 shadow-xl backdrop-blur-sm flex flex-col items-center justify-center text-slate-500 text-xs space-y-2 select-none">
              <div className="flex items-center gap-2 text-slate-400 font-semibold">
                <Film className="w-4 h-4 text-indigo-400" />
                <span>แถบตัดต่อวิดีโอ (Timeline)</span>
              </div>
              <div className="w-full h-14 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-center text-slate-500 text-xs">
                <span>แถบตัดต่อจะแสดงวิดีโอทั้งหมดและพร้อมให้พรีวิวทันทีเมื่อคุณเลือกไฟล์เข้ามา</span>
              </div>
            </div>
          ) : (
            <Timeline
              clips={clipQueue}
              activeClipId={activeClip.id}
              onSelectClip={id => {
                setActiveClipId(id);
                const range = sequenceTimeline.ranges.find(r => r.id === id);
                if (range) handleSeekProject(range.projectStart);
              }}
              onUpdateClipTrim={(clipId, start, end) => {
                setClipQueue(prev =>
                  prev.map(c => (c.id === clipId ? { ...c, startSeconds: start, endSeconds: end } : c))
                );
              }}
              onRangeChange={handleRangeChange}
              onSeekProject={handleSeekProject}
              projectTime={projectTime}
              totalDuration={sequenceTimeline.totalDuration}
              snapToKeyframe={snapToKeyframe}
              onToggleSnap={setSnapToKeyframe}
              isFastPathEligible={activeClip.metadata.isWebCodecsFastPathCompatible}
            />
          )}
        </section>

        {/* ================= SEO & Informational Section ================= */}
        <section className="w-full pt-8 pb-4 space-y-8 border-t border-slate-800/80 mt-4 text-slate-300">
          <h1 className="sr-only">
            ตัดคลิปไว — เครื่องมือตัดต่อวิดีโอออนไลน์ฟรี ตัดคลิป รวมคลิป ปลอดภัย 100%
          </h1>

          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              ตัดคลิปไว — เครื่องมือตัดต่อวิดีโอออนไลน์ฟรี ที่เร็วและปลอดภัยที่สุด
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              ตัดต่อคลิป รวมวิดีโอหลายไฟล์ และปรับขนาดภาพสำหรับลง TikTok, Reels, Shorts และ YouTube ได้ทันทีในเว็บเบราว์เซอร์ ไม่ต้องติดตั้งโปรแกรม
            </p>
          </div>

          {/* 4 Key Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                ⚡
              </div>
              <h3 className="text-xs font-bold text-white">ตัดต่อเสร็จในเสี้ยววินาที</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ใช้เทคโนโลยีประมวลผลทันทีในเบราว์เซอร์ สามารถตัดและรวมคลิปได้รวดเร็วโดยไม่ต้องรอ Render นาน
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                🔒
              </div>
              <h3 className="text-xs font-bold text-white">ปลอดภัยสูงสุด 100%</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ไฟล์วิดีโอของคุณจะถูกประมวลผลอยู่ภายในเครื่องของคุณเองเท่านั้น ไม่มีการอัปโหลดไฟล์ขึ้นเซิร์ฟเวอร์ใด ๆ
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                📱
              </div>
              <h3 className="text-xs font-bold text-white">ปรับขนาดลงโซเชียลทันที</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                รองรับอัตราส่วน 9:16 สำหรับ TikTok, Reels และ Shorts หรือ 16:9 แนวนอนสำหรับ YouTube ได้ในคลิกเดียว
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold">
                🆓
              </div>
              <h3 className="text-xs font-bold text-white">ฟรี 100% ไม่มีลายน้ำ</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ใช้งานได้ฟรีตลอดไป ไม่มีลายน้ำติดบนวิดีโอ ไม่จำกัดจำนวนครั้ง และไม่ต้องสมัครสมาชิก
              </p>
            </div>
          </div>

          {/* Quick FAQ */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4 max-w-3xl mx-auto">
            <h3 className="text-sm font-bold text-white text-center">คำถามที่พบบ่อย (FAQ)</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-slate-200">Q: ตัดคลิปไว ปลอดภัยไหม ไฟล์จะหลุดหรือไม่?</p>
                <p className="text-slate-400 text-[11px]">
                  A: ปลอดภัย 100% ครับ ระบบของเราทำงานบนเครื่องของคุณทั้งหมดผ่านเบราว์เซอร์ ไม่มีการส่งข้อมูลวิดีโอออกไปยังอินเทอร์เน็ตเลย
                </p>
              </div>
              <div className="space-y-1 border-t border-slate-800/60 pt-2">
                <p className="font-semibold text-slate-200">Q: สามารถรวมหลายคลิปเข้าด้วยกันได้ไหม?</p>
                <p className="text-slate-400 text-[11px]">
                  A: ได้ครับ คุณสามารถเลือกไฟล์เข้ามาได้หลายไฟล์พร้อมกัน ระบบจะนำมาต่อกันบนแถบไทม์ไลน์ และตัดต่อแต่ละคลิปได้ตามต้องการก่อนบันทึกรวมเป็นไฟล์เดียว
                </p>
              </div>
              <div className="space-y-1 border-t border-slate-800/60 pt-2">
                <p className="font-semibold text-slate-200">Q: รองรับไฟล์วิดีโอประเภทใดบ้าง?</p>
                <p className="text-slate-400 text-[11px]">
                  A: รองรับไฟล์วิดีโอยอดนิยมทุกประเภท เช่น MP4, MOV (จาก iPhone), WebM และ MKV สามารถบันทึกออกมาเป็น MP4 หรือ WebM ได้ทันที
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Google AdSense & Privacy Consent Modal */}
      <AdConsentModal
        isOpen={isAdConsentOpen}
        onAccept={handleAcceptAdConsent}
        onClose={() => setIsAdConsentOpen(false)}
      />

      {/* Export Progress / Result Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        isExporting={isExporting}
        progressPercent={exportProgress}
        statusText={exportStatusText}
        result={exportResult}
        errorMessage={exportError}
        engineUsed={routingDecision.engine as 'webcodecs' | 'ffmpeg'}
        onClose={() => setIsExportModalOpen(false)}
        onDownload={handleDownload}
      />

      {/* Benchmark Diagnostics & Telemetry Modal */}
      <BenchmarkModal
        isOpen={isBenchmarkModalOpen}
        env={env}
        onClose={() => setIsBenchmarkModalOpen(false)}
      />

      {/* Low-End Device / Heavy Operation Warning Modal */}
      {clipQueue.length > 0 && (
        <LowEndWarningModal
          isOpen={isLowEndWarningOpen}
          profile={devicePerf}
          fileSizeBytes={clipQueue.reduce((sum, c) => sum + c.file.size, 0)}
          onProceed={executeExport}
          onCancel={() => setIsLowEndWarningOpen(false)}
        />
      )}

      <footer className="border-t border-slate-900 py-3 px-6 text-center text-xs text-slate-500">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ตัดคลิปไว • เครื่องมือตัดต่อวิดีโอในเว็บ ปลอดภัย 100% ไม่มีการส่งไฟล์ไปที่ใด</span>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <button
              type="button"
              onClick={() => setIsAdConsentOpen(true)}
              className="hover:text-indigo-400 underline decoration-slate-700 hover:decoration-indigo-400 transition-colors cursor-pointer"
            >
              🍪 การยินยอมโฆษณา &amp; ความเป็นส่วนตัว
            </button>
            <span>•</span>
            <span>🔒 วิดีโอประมวลผลในเครื่องของคุณ</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
