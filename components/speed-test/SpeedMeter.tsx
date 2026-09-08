"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface SpeedMeterProps {
  currentMbps: number;
  phase?: "DOWNLOAD_TEST" | "UPLOAD_TEST" | string;
}

/**
 * Dynamic meter scale tiers. The meter starts small and expands only when the
 * live speed approaches the current maximum, so it stays accurate on both slow
 * and very fast connections without constantly rescaling during small jitter.
 */
const SCALE_TIERS = [50, 100, 250, 500, 1000, 2000];

const INITIAL_MAX = 100;

function resolveMaxScale(currentMbps: number, currentMax: number): number {
  // Expand when speed nears 85% of the current range. Never shrink mid-phase,
  // so normal fluctuations don't cause the scale to thrash.
  if (currentMbps >= currentMax * 0.85) {
    const next = SCALE_TIERS.find((t) => t > currentMax);
    if (next) return next;
  }
  return currentMax;
}

function formatTick(value: number): string {
  if (value >= 1000) return `${Math.round(value / 1000)}G`;
  return `${Math.round(value / 10) * 10}`;
}

/**
 * High-tech SVG Circular Speedometer Gauge with dynamic scale and a live, real-
 * data-driven needle. The needle follows `currentMbps` (fed straight from the
 * measurement engine); only the animation is spring-smoothed — the value itself
 * is never modified.
 */
export const SpeedMeter: React.FC<SpeedMeterProps> = ({
  currentMbps,
  phase = "DOWNLOAD_TEST",
}) => {
  const [maxScale, setMaxScale] = useState(INITIAL_MAX);

  // Expand the meter range only when the live speed justifies it.
  useEffect(() => {
    setMaxScale((cur) => resolveMaxScale(currentMbps, cur));
  }, [currentMbps, maxScale]);

  const normalizedSpeed = Math.min(currentMbps, maxScale);
  const percentage = Math.min(1, Math.max(0, normalizedSpeed / maxScale));

  // Gauge geometry: 240-degree arc from 150deg to 390deg.
  const radius = 100;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (240 / 360) * circumference;
  const fullOffset = arcLength;
  const targetOffset = arcLength - percentage * arcLength;

  // Spring-animated arc fill for smooth motion.
  const springOffset = useSpring(fullOffset, { stiffness: 100, damping: 18, mass: 0.8 });
  useEffect(() => {
    springOffset.set(targetOffset);
  }, [targetOffset, springOffset]);

  // Spring-animated needle angle: -120 (0 speed) to +120 (max speed).
  const springAngle = useSpring(-120, { stiffness: 100, damping: 15, mass: 0.8 });
  const targetAngle = -120 + percentage * 240;
  useEffect(() => {
    springAngle.set(targetAngle);
  }, [targetAngle, springAngle]);

  const arcDashoffset = useTransform(springOffset, (v) => `${v} ${circumference}`);

  const isDownload = phase === "DOWNLOAD_TEST";
  const strokeColor = isDownload ? "url(#cyan-emerald-grad)" : "url(#purple-cyan-grad)";
  const glowColor = isDownload ? "rgba(6, 182, 212, 0.4)" : "rgba(168, 85, 247, 0.4)";

  // Dynamic tick labels at 0 / 25% / 50% / 75% / 100% of the current scale,
  // positioned along the 240-degree arc (angle -120° → +120° from 12 o'clock).
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const angleRad = ((-120 + f * 240) * Math.PI) / 180;
    // Keep ticks just inside the arc (r ≈ 40% of the container).
    const x = 50 + Math.sin(angleRad) * 40;
    const y = 50 - Math.cos(angleRad) * 40;
    const value = f === 1 ? maxScale : Math.round(maxScale * f);
    return { f, x, y, label: f === 1 ? `${formatTick(maxScale)}+` : formatTick(value) };
  });

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
          cx={120}
          cy={120}
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
          cx={120}
          cy={120}
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
          cx={120}
          cy={120}
          r={82}
          fill="none"
          stroke="#0f172a"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      </svg>

      {/* Dynamic Speedometer Tick Marks */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {ticks.map((t) => (
          <span
            key={t.label}
            className="absolute text-[10px] font-bold text-slate-500 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
          >
            {t.label}
          </span>
        ))}
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