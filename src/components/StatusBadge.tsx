import React from 'react';
import { ShieldCheck, Zap, Cpu, AlertCircle, Database } from 'lucide-react';
import type { EnvironmentSupport } from '../types';

interface StatusBadgeProps {
  env: EnvironmentSupport;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ env }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Zero Storage Badge */}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
        <ShieldCheck className="w-3.5 h-3.5" />
        Zero Server Storage
      </span>

      {/* WebCodecs Fast Path Badge */}
      {env.hasWebCodecs ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
          <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          WebCodecs Fast Path
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          <AlertCircle className="w-3.5 h-3.5" />
          WebCodecs N/A
        </span>
      )}

      {/* ffmpeg.wasm / SharedArrayBuffer Badge */}
      {env.isCrossOriginIsolated && env.hasSharedArrayBuffer ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
          <Cpu className="w-3.5 h-3.5" />
          COOP/COEP Active (SharedArrayBuffer)
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          No SharedArrayBuffer
        </span>
      )}

      {/* OPFS Badge */}
      {env.hasOPFS && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          <Database className="w-3.5 h-3.5" />
          OPFS Ready
        </span>
      )}
    </div>
  );
};
