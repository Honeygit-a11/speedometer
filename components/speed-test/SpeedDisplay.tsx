"use client";

import React, { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowUp, Activity } from "lucide-react";

interface SpeedDisplayProps {
  speedMbps: number;
  phase: string;
  bytesTransferred?: number;
}

export const SpeedDisplay: React.FC<SpeedDisplayProps> = ({
  speedMbps,
  phase,
  bytesTransferred = 0,
}) => {
  const isDownload = phase === "DOWNLOAD_TEST";
  const isUpload = phase === "UPLOAD_TEST";
  const isPing = phase === "PING_TEST";

  const transferredMB = (bytesTransferred / (1024 * 1024)).toFixed(1);

  // Animated counting number via useMotionValue + useSpring
  const motionVal = useMotionValue(speedMbps);
  const springVal = useSpring(motionVal, { stiffness: 120, damping: 18, mass: 0.6 });
  const displayVal = useTransform(springVal, (v) => v.toFixed(1));
  const refDisplayed = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionVal.set(speedMbps);
  }, [speedMbps, motionVal]);

  // Write the transformed value directly to the DOM for 60fps performance
  useEffect(() => {
    const unsub = displayVal.on("change", (v) => {
      if (refDisplayed.current) refDisplayed.current.textContent = v;
    });
    return unsub;
  }, [displayVal]);

  return (
    <div className="flex flex-col items-center justify-center text-center">
      {/* Direction & Status Header */}
      <div className="flex items-center gap-2 mb-1">
        {isDownload && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
            <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Testing Download</span>
          </div>
        )}
        {isUpload && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
            <ArrowUp className="w-3.5 h-3.5 text-purple-400" />
            <span>Testing Upload</span>
          </div>
        )}
        {isPing && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Measuring Latency</span>
          </div>
        )}
      </div>

      {/* Numerical Speed Readout — spring-animated counting number */}
      <div className="flex items-baseline gap-2">
        <span
          className={`text-5xl sm:text-7xl font-extrabold tracking-tight ${
            isDownload
              ? "text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              : isUpload
              ? "text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              : "text-white"
          }`}
          ref={refDisplayed}
        >
          {speedMbps.toFixed(1)}
        </span>
        <span className="text-base sm:text-xl font-bold uppercase tracking-wider text-slate-400">
          Mbps
        </span>
      </div>

      {/* Transferred Volume Subtext */}
      {bytesTransferred > 0 && (
        <span className="text-xs text-slate-500 font-medium mt-1">
          Transferred: {transferredMB} MB
        </span>
      )}
    </div>
  );
};
