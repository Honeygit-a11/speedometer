"use client";

import React, { useEffect, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";

interface SpeedMeterProps {
  currentMbps: number;
  phase?: "DOWNLOAD_TEST" | "UPLOAD_TEST" | string;
  bytesTransferred?: number;
}

/**
 * Non-linear scale matching Ookla Speedtest gauge:
 *  0 -> 5 -> 10 -> 50 -> 100 (top center / 12 o'clock) -> 250 -> 500 -> 750 -> 1000
 * Symmetrical 270-degree arc from -135° to +135°
 */
const SCALE_POINTS = [
  { speed: 0, angle: -135, label: "0" },
  { speed: 5, angle: -105, label: "5" },
  { speed: 10, angle: -75, label: "10" },
  { speed: 50, angle: -37.5, label: "50" },
  { speed: 100, angle: 0, label: "100" },
  { speed: 250, angle: 37.5, label: "250" },
  { speed: 500, angle: 75, label: "500" },
  { speed: 750, angle: 105, label: "750" },
  { speed: 1000, angle: 135, label: "1000" },
];

function speedToAngle(speed: number): number {
  if (speed <= 0) return -135;
  if (speed >= 1000) return 135;

  for (let i = 0; i < SCALE_POINTS.length - 1; i++) {
    const p0 = SCALE_POINTS[i];
    const p1 = SCALE_POINTS[i + 1];
    if (speed >= p0.speed && speed <= p1.speed) {
      const ratio = (speed - p0.speed) / (p1.speed - p0.speed);
      return p0.angle + ratio * (p1.angle - p0.angle);
    }
  }
  return 135;
}

// Tick positions are pure geometry — compute once at module load, not per render.
const TICK_RADIUS = 93;
const CX = 170;
const CY = 170;
const TICKS = SCALE_POINTS.map((pt) => {
  const rad = (pt.angle * Math.PI) / 180;
  return { ...pt, x: CX + TICK_RADIUS * Math.sin(rad), y: CY - TICK_RADIUS * Math.cos(rad) };
});

export const SpeedMeter: React.FC<SpeedMeterProps> = ({
  currentMbps,
  phase = "DOWNLOAD_TEST",
  bytesTransferred = 0,
}) => {
  const isUpload = phase === "UPLOAD_TEST";

  // Respect prefers-reduced-motion: use a near-instant spring instead of a
  // smooth glide so the needle tracks the value without smooth animation.
  const reduceMotion = useReducedMotion();
  const spring = reduceMotion
    ? { stiffness: 400, damping: 40 }
    : { stiffness: 85, damping: 15, mass: 0.7 };

  // Target angle based on speed
  const targetAngle = speedToAngle(currentMbps);

  // Normalized progress from 0 (at -135°) to 1 (at +135°)
  const targetProgress = Math.max(0, Math.min(1, (targetAngle - (-135)) / 270));

  // Spring-animated needle angle
  const springAngle = useSpring(targetAngle, spring);

  useEffect(() => {
    springAngle.set(targetAngle);
  }, [targetAngle, springAngle]);

  // Spring-animated arc progress
  const motionProgress = useMotionValue(targetProgress);
  const springProgress = useSpring(motionProgress, spring);

  useEffect(() => {
    motionProgress.set(targetProgress);
  }, [targetProgress, motionProgress]);

  // Arc geometry constants
  const cx = 170;
  const cy = 170;
  const radius = 126;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius; // ≈ 791.68
  const totalArcLength = (270 / 360) * circumference; // ≈ 593.76

  // SVG dash array for active arc
  const arcDasharray = useTransform(springProgress, (p) => {
    const activeLength = Math.max(0.001, Math.min(totalArcLength, p * totalArcLength));
    return `${activeLength} ${circumference}`;
  });

  // Animated speed readout counter (formatted to 2 decimal places e.g. 100.55).
  // At/above 1000 Mbps the readout switches to Gbps so gigabit connections are
  // shown as e.g. "1.24 Gbps" rather than "1240.00 Mbps". The dial is capped at
  // 1000 (needle pegs at max), matching the Ookla-style 0-1000 scale.
  const showGbps = currentMbps >= 1000;
  const motionSpeed = useMotionValue(currentMbps);
  const springSpeed = useSpring(motionSpeed, spring);
  const displayVal = useTransform(springSpeed, (v) =>
    showGbps ? (v / 1000).toFixed(2) : v.toFixed(2)
  );
  const speedTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionSpeed.set(currentMbps);
  }, [currentMbps, motionSpeed]);

  useEffect(() => {
    const unsub = displayVal.on("change", (v) => {
      if (speedTextRef.current) {
        speedTextRef.current.textContent = v;
      }
    });
    return unsub;
  }, [displayVal]);

  // Derive per-tick active state from current speed (positions are pre-computed at module scope).
  const ticks = TICKS.map((t) => ({
    ...t,
    isActive: currentMbps >= t.speed || (t.speed === 100 && currentMbps >= 95),
  }));

  const transferredMB = (bytesTransferred / (1024 * 1024)).toFixed(1);

  return (
    <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center select-none">
      {/* Ambient background bloom glow inside gauge */}
      <div
        className="absolute inset-4 rounded-full pointer-events-none opacity-80"
        style={{
          background:
            "radial-gradient(circle at 40% 35%, rgba(236, 72, 153, 0.16) 0%, rgba(139, 92, 246, 0.08) 45%, transparent 70%)",
        }}
      />

      {/* SVG Speedometer Dial */}
      <svg
        className="w-full h-full"
        viewBox="0 0 340 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Vibrant purple to neon pink gradient matching Ookla design */}
          <linearGradient
            id="speedmeter-active-gradient"
            x1="10%"
            y1="90%"
            x2="85%"
            y2="15%"
          >
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="25%" stopColor="#9333ea" />
            <stop offset="55%" stopColor="#d946ef" />
            <stop offset="78%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#ff4cb5" />
          </linearGradient>

          {/* Glow filter for active arc */}
          <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Inactive Background Track Arc (Deep Slate Navy) */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#222634"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={`${totalArcLength} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(135 ${cx} ${cy})`}
        />

        {/* 2. Soft Ambient Arc Glow */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="url(#speedmeter-active-gradient)"
          strokeWidth={strokeWidth + 6}
          strokeLinecap="butt"
          strokeDasharray={arcDasharray}
          strokeDashoffset={0}
          filter="url(#arc-glow)"
          opacity={0.35}
          transform={`rotate(135 ${cx} ${cy})`}
        />

        {/* 3. Active Progress Arc (Purple to Neon Pink) */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="url(#speedmeter-active-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={arcDasharray}
          strokeDashoffset={0}
          transform={`rotate(135 ${cx} ${cy})`}
        />

        {/* 4. Scale Numbers (0, 5, 10, 50, 100, 250, 500, 750, 1000) */}
        {ticks.map((t) => (
          <text
            key={t.speed}
            x={t.x}
            y={t.y}
            textAnchor="middle"
            dominantBaseline="central"
            className={`text-[13px] sm:text-[14px] select-none transition-colors duration-200 ${
              t.isActive
                ? "fill-white font-bold"
                : "fill-[#545a6d] font-semibold"
            }`}
            style={{
              fontFamily:
                "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {t.label}
          </text>
        ))}
      </svg>

      {/* 5. Needle — Tapered Wedge with Translucent Gradient */}
      <motion.div
        className="absolute pointer-events-none flex flex-col items-center"
        style={{
          width: 15,
          height: 82,
          left: "calc(50% - 7.5px)",
          top: "calc(50% - 82px)",
          transformOrigin: "bottom center",
          rotate: springAngle,
        }}
      >
        <div
          className="w-full h-full"
          style={{
            clipPath: "polygon(22% 100%, 78% 100%, 100% 0%, 0% 0%)",
            background:
              "linear-gradient(to top, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.16) 35%, rgba(255, 255, 255, 0.65) 80%, rgba(255, 255, 255, 0.92) 100%)",
            borderRadius: "2px 2px 0 0",
            filter: "drop-shadow(0 0 6px rgba(255, 255, 255, 0.25))",
          }}
        />
      </motion.div>

      {/* 6. Digital Readout (Lower Center of Gauge) */}
      <div className="absolute inset-x-0 bottom-[14%] sm:bottom-[15%] flex flex-col items-center justify-center pointer-events-none">
        {/* Numerical Speed Readout (e.g. 100.55) */}
        <span
          ref={speedTextRef}
          className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] font-sans"
        >
          {(showGbps ? currentMbps / 1000 : currentMbps).toFixed(2)}
        </span>

        {/* Direction Icon + Unit */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="w-4 h-4 rounded-full border border-purple-400/90 flex items-center justify-center text-purple-400">
            {isUpload ? (
              <ArrowUp className="w-2.5 h-2.5 stroke-[2.5]" />
            ) : (
              <ArrowDown className="w-2.5 h-2.5 stroke-[2.5]" />
            )}
          </div>
          <span className="text-purple-400 font-medium text-xs sm:text-sm tracking-wide">
            {showGbps ? "Gbps" : "Mbps"}
          </span>
        </div>

        {/* Transferred Volume Subtext */}
        {bytesTransferred > 0 && (
          <span className="text-[10px] text-slate-500 font-medium mt-1">
            {transferredMB} MB transferred
          </span>
        )}
      </div>
    </div>
  );
};