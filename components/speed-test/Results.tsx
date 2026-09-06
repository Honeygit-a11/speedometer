"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Activity,
  RotateCcw,
  Sparkles,
  Server,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { TestResults } from "@/types";

interface ResultsProps {
  results: TestResults;
  onRestart: () => void;
}

export const Results: React.FC<ResultsProps> = ({ results, onRestart }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { downloadSpeed, uploadSpeed, ping, jitter, timestamp, loadedLatency, stability } = results;

  // Grade network performance
  const getQualityTier = (mbps: number) => {
    if (mbps >= 200) {
      return {
        badge: "Ultra-Fast Edge Grade",
        description: "Optimal for simultaneous 4K/8K streaming, competitive low-ping gaming, and heavy cloud transfers.",
        color: "from-emerald-400 to-teal-400",
      };
    }
    if (mbps >= 50) {
      return {
        badge: "High-Speed Broadband",
        description: "Excellent performance for multiple HD video calls, streaming, and rapid downloads.",
        color: "from-cyan-400 to-emerald-400",
      };
    }
    return {
      badge: "Standard Connection",
      description: "Good for everyday web browsing, social media, and single-stream media playback.",
      color: "from-amber-400 to-cyan-400",
    };
  };

  const tier = getQualityTier(downloadSpeed);
  const formattedDate = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return "text-emerald-400 bg-emerald-950/60 border-emerald-800/60";
      case "B":
        return "text-cyan-400 bg-cyan-950/60 border-cyan-800/60";
      case "C":
        return "text-amber-400 bg-amber-950/60 border-amber-800/60";
      default:
        return "text-rose-400 bg-rose-950/60 border-rose-800/60";
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-300">
      {/* Tier Badge & Summary Banner */}
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-semibold shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className={`bg-gradient-to-r ${tier.color} bg-clip-text text-transparent font-bold`}>
            {tier.badge}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md">
          {tier.description}
        </p>
      </div>

      {/* Main Dual Metric Callout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        {/* Download Hero Result */}
        <div className="p-6 rounded-2xl glass-panel flex flex-col items-center justify-center border-cyan-500/30 bg-cyan-950/20 shadow-lg shadow-cyan-500/10">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 uppercase font-semibold tracking-wider mb-2">
            <ArrowDown className="w-4 h-4" />
            <span>Download</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              {downloadSpeed}
            </span>
            <span className="text-sm font-bold text-slate-400">Mbps</span>
          </div>
        </div>

        {/* Upload Hero Result */}
        <div className="p-6 rounded-2xl glass-panel flex flex-col items-center justify-center border-purple-500/30 bg-purple-950/20 shadow-lg shadow-purple-500/10">
          <div className="flex items-center gap-1.5 text-xs text-purple-400 uppercase font-semibold tracking-wider mb-2">
            <ArrowUp className="w-4 h-4" />
            <span>Upload</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              {uploadSpeed}
            </span>
            <span className="text-sm font-bold text-slate-400">Mbps</span>
          </div>
        </div>
      </div>

      {/* Latency & Jitter Subgrid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        <div className="p-3.5 rounded-xl glass-panel flex items-center justify-between border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-xs text-slate-400 font-medium">Ping</span>
          </div>
          <span className="text-base font-bold text-white">
            {ping} <span className="text-xs text-slate-500">ms</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl glass-panel flex items-center justify-between border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-800/40 flex items-center justify-center">
              <Server className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-xs text-slate-400 font-medium">Jitter</span>
          </div>
          <span className="text-base font-bold text-white">
            {jitter} <span className="text-xs text-slate-500">ms</span>
          </span>
        </div>
      </div>

      {/* Advanced Network Metrics Accordion Toggle */}
      <div className="w-full max-w-md">
        <button
          id="toggle-advanced-metrics-btn"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-2.5 px-4 rounded-xl glass-panel border-slate-800/80 hover:border-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Advanced Diagnostics (Loaded Latency & Stability)</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 rounded-2xl glass-panel border-slate-800/80 space-y-4 text-left animate-in fade-in slide-in-from-top-2">
            {/* Loaded Latency (Bufferbloat) Section */}
            {loadedLatency && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Bufferbloat & Loaded Latency
                  </span>
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded-md border ${getGradeColor(
                      loadedLatency.bufferbloatGrade
                    )}`}
                  >
                    Grade {loadedLatency.bufferbloatGrade}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-medium block">Idle</span>
                    <span className="text-sm font-bold text-white">{loadedLatency.idleMs} ms</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-medium block">Download</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {loadedLatency.downloadLoadedMs} ms
                    </span>
                    <span className="text-[9px] text-slate-500 block">
                      +{loadedLatency.downloadDeltaMs}ms
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-medium block">Upload</span>
                    <span className="text-sm font-bold text-purple-400">
                      {loadedLatency.uploadLoadedMs} ms
                    </span>
                    <span className="text-[9px] text-slate-500 block">
                      +{loadedLatency.uploadDeltaMs}ms
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Stability Section */}
            {stability && (
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Connection Consistency
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {stability.rating} ({stability.score}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${stability.score}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Speed Consistency: {stability.speedConsistency}%</span>
                  <span>Latency Consistency: {stability.latencyConsistency}%</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[10px] text-slate-500">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Real-time RFC 3550 & statistical delta calculations (zero synthetic data)</span>
            </div>
          </div>
        )}
      </div>

      {/* Test Again Button & Timestamp */}
      <div className="flex flex-col items-center space-y-3 pt-1">
        <button
          id="test-again-btn"
          onClick={onRestart}
          className="px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 active:scale-95 text-slate-950 font-bold text-base shadow-xl shadow-cyan-500/25 transition-all flex items-center gap-2.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Test Again</span>
        </button>

        <span className="text-[11px] text-slate-500">
          Tested at {formattedDate} &bull; Browser-to-Edge Direct
        </span>
      </div>
    </div>
  );
};
