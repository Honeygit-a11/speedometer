import React from "react";
import { ShieldCheck, Zap } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              SpeedPulse
            </span>
            <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold ml-2 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
              Edge
            </span>
          </div>
        </div>

        {/* Server & Privacy Badges */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-edge-pulse" />
            <span className="text-slate-300">Cloudflare Edge Node</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">Zero-Log</span>
          </div>
        </div>
      </div>
    </header>
  );
};
