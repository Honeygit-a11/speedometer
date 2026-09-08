"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  colorScheme: "cyan" | "purple" | "emerald" | "amber";
  isActive?: boolean;
}

const glowColors: Record<string, string> = {
  cyan: "rgba(6, 182, 212, 0.15)",
  purple: "rgba(168, 85, 247, 0.15)",
  emerald: "rgba(16, 185, 129, 0.15)",
  amber: "rgba(245, 158, 11, 0.15)",
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/**
 * Memoized so the four live metric cards don't all re-render on every high-
 * frequency progress tick — only the active card's value changes; the others
 * keep stable primitive props and are skipped.
 */
export const MetricCard: React.FC<MetricCardProps> = React.memo(function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  colorScheme,
  isActive = false,
}) {
  const colorMap = {
    cyan: {
      border: isActive ? "border-cyan-500/80 shadow-lg shadow-cyan-500/20" : "border-slate-800/80",
      iconBg: "bg-cyan-950/60 border-cyan-800/40 text-cyan-400",
      accentText: "text-cyan-400",
    },
    purple: {
      border: isActive ? "border-purple-500/80 shadow-lg shadow-purple-500/20" : "border-slate-800/80",
      iconBg: "bg-purple-950/60 border-purple-800/40 text-purple-400",
      accentText: "text-purple-400",
    },
    emerald: {
      border: isActive ? "border-emerald-500/80 shadow-lg shadow-emerald-500/20" : "border-slate-800/80",
      iconBg: "bg-emerald-950/60 border-emerald-800/40 text-emerald-400",
      accentText: "text-emerald-400",
    },
    amber: {
      border: isActive ? "border-amber-500/80 shadow-lg shadow-amber-500/20" : "border-slate-800/80",
      iconBg: "bg-amber-950/60 border-amber-800/40 text-amber-400",
      accentText: "text-amber-400",
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3, scale: 1.02, boxShadow: `0 8px 30px ${glowColors[colorScheme]}` }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`p-4 rounded-2xl glass-panel flex flex-col items-center text-center space-y-1 ${scheme.border} ${
        isActive ? "ring-1 ring-cyan-500/30 -translate-y-0.5" : ""
      }`}
    >
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-1 ${scheme.iconBg}`}>
        <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
      </div>
      <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
        {title}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl sm:text-2xl font-bold tracking-tight ${isActive ? scheme.accentText : "text-white"}`}>
          {value !== 0 && value !== "--" ? value : "--"}
        </span>
        <span className="text-xs text-slate-500 font-semibold">
          {unit}
        </span>
      </div>
    </motion.div>
  );
});
