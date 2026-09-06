"use client";

import React from "react";

interface SpeedMeterProps {
  currentMbps: number;
  maxScaleMbps?: number;
  phase?: "DOWNLOAD_TEST" | "UPLOAD_TEST" | string;
}

/**
 * High-tech SVG Circular Speedometer Gauge with Neon Glow
 */
export const SpeedMeter: React.FC<SpeedMeterProps> = ({
  currentMbps,
  maxScaleMbps = 500,
  phase = "DOWNLOAD_TEST",
}) => {
  // Use logarithmic or progressive scale so low speeds (<50 Mbps) and high speeds (>200 Mbps) both animate visibly
  const normalizedSpeed = Math.min(currentMbps, maxScaleMbps);
  const percentage = Math.min(1, Math.max(0, normalizedSpeed / maxScaleMbps));

  // Gauge geometry: 240-degree arc from 150deg to 390deg (or -210 to 30)
  const radius = 100;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (240 / 360) * circumference;
  const strokeDashoffset = arcLength - percentage * arcLength;

  const isDownload = phase === "DOWNLOAD_TEST";
  const strokeColor = isDownload ? "url(#cyan-emerald-grad)" : "url(#purple-cyan-grad)";
  const glowColor = isDownload ? "rgba(6, 182, 212, 0.4)" : "rgba(168, 85, 247, 0.4)";

  // Needle angle from -120 deg (0 speed) to +120 deg (max speed)
  const needleAngle = -120 + percentage * 240;

  return (
    <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
        <defs>
          <linearGradient id="cyan-emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="purple-cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Track Arc */}
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          transform="rotate(150 120 120)"
        />

        {/* Dynamic Progress Arc */}
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          filter="url(#gauge-glow)"
          transform="rotate(150 120 120)"
          className="transition-all duration-150 ease-out"
        />

        {/* Decorative Inner Ring */}
        <circle
          cx="120"
          cy="120"
          r="82"
          fill="none"
          stroke="#0f172a"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Speedometer Tick Marks */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <span className="absolute bottom-6 left-12 text-[10px] font-bold text-slate-500">0</span>
        <span className="absolute top-12 left-8 text-[10px] font-bold text-slate-500">50</span>
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500">100</span>
        <span className="absolute top-12 right-8 text-[10px] font-bold text-slate-500">250</span>
        <span className="absolute bottom-6 right-12 text-[10px] font-bold text-slate-500">500+</span>
      </div>

      {/* Center Pivot & Needle Pulse */}
      <div
        className="absolute w-full h-full pointer-events-none flex items-center justify-center transition-transform duration-150 ease-out"
        style={{ transform: `rotate(${needleAngle}deg)` }}
      >
        <div
          className="w-1 h-20 rounded-full mb-20 origin-bottom transition-all duration-150"
          style={{
            background: isDownload
              ? "linear-gradient(to top, #06b6d4, #10b981)"
              : "linear-gradient(to top, #c084fc, #06b6d4)",
            boxShadow: `0 0 12px ${glowColor}`,
          }}
        />
      </div>

      {/* Center Pivot Point */}
      <div className="absolute w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-400 shadow-md shadow-cyan-500/50" />
    </div>
  );
};
