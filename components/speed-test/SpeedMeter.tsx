"use client";

import React from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface SpeedMeterProps {
  currentMbps: number;
  maxScaleMbps?: number;
  phase?: "DOWNLOAD_TEST" | "UPLOAD_TEST" | string;
}

/**
 * High-tech SVG Circular Speedometer Gauge with Neon Glow — Framer Motion spring needle + arc
 */
export const SpeedMeter: React.FC<SpeedMeterProps> = ({
  currentMbps,
  maxScaleMbps = 500,
  phase = "DOWNLOAD_TEST",
}) => {
  const normalizedSpeed = Math.min(currentMbps, maxScaleMbps);
  const percentage = Math.min(1, Math.max(0, normalizedSpeed / maxScaleMbps));

  // Gauge geometry: 240-degree arc from 150deg to 390deg
  const radius = 100;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (240 / 360) * circumference;
  const fullOffset = arcLength; // 0% speed = full offset (arc hidden)
  const targetOffset = arcLength - percentage * arcLength;

  // Spring-animated stroke-dashoffset for smooth arc fill
  const springOffset = useSpring(fullOffset, { stiffness: 100, damping: 18, mass: 0.8 });
  React.useEffect(() => {
    springOffset.set(targetOffset);
  }, [targetOffset, springOffset]);

  // Spring-animated needle angle: -120 (0 speed) to +120 (max speed)
  const springAngle = useSpring(-120, { stiffness: 100, damping: 15, mass: 0.8 });
  const targetAngle = -120 + percentage * 240;
  React.useEffect(() => {
    springAngle.set(targetAngle);
  }, [targetAngle, springAngle]);

  // Map spring value to arc dashoffset string
  const arcDashoffset = useTransform(springOffset, (v) => `${v} ${circumference}`);

  const isDownload = phase === "DOWNLOAD_TEST";
  const strokeColor = isDownload ? "url(#cyan-emerald-grad)" : "url(#purple-cyan-grad)";
  const glowColor = isDownload ? "rgba(6, 182, 212, 0.4)" : "rgba(168, 85, 247, 0.4)";

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

        {/* Dynamic Progress Arc — spring-animated */}
        <motion.circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcDashoffset}
          filter="url(#gauge-glow)"
          transform="rotate(150 120 120)"
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

      {/* Center Pivot & Needle — spring-animated rotation */}
      <motion.div
        className="absolute w-full h-full pointer-events-none flex items-center justify-center"
        style={{ rotate: springAngle }}
      >
        <div
          className="w-1 h-20 rounded-full mb-20 origin-bottom"
          style={{
            background: isDownload
              ? "linear-gradient(to top, #06b6d4, #10b981)"
              : "linear-gradient(to top, #c084fc, #06b6d4)",
            boxShadow: `0 0 12px ${glowColor}`,
          }}
        />
      </motion.div>

      {/* Center Pivot Point */}
      <div className="absolute w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-400 shadow-md shadow-cyan-500/50" />
    </div>
  );
};
