"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity, ArrowDown, ArrowUp, Check, Award, Server } from "lucide-react";
import { TestPhase } from "@/types";

interface TestProgressProps {
  phase: TestPhase;
}

export const TestProgress: React.FC<TestProgressProps> = ({ phase }) => {
  const steps = [
    {
      id: "SERVER",
      label: "Server",
      icon: Server,
      color: "cyan",
      isCompleted: ["PING_TEST", "DOWNLOAD_TEST", "UPLOAD_TEST", "PROCESS_RESULTS", "COMPLETED"].includes(phase),
      isActive: ["INITIALIZING", "DISCOVERING_SERVERS", "PROBING_SERVERS", "SELECTING_SERVER"].includes(phase),
    },
    {
      id: "PING_TEST",
      label: "Ping",
      icon: Activity,
      color: "emerald",
      isCompleted: ["DOWNLOAD_TEST", "UPLOAD_TEST", "PROCESS_RESULTS", "COMPLETED"].includes(phase),
      isActive: phase === "PING_TEST",
    },
    {
      id: "DOWNLOAD_TEST",
      label: "Download",
      icon: ArrowDown,
      color: "cyan",
      isCompleted: ["UPLOAD_TEST", "PROCESS_RESULTS", "COMPLETED"].includes(phase),
      isActive: phase === "DOWNLOAD_TEST",
    },
    {
      id: "UPLOAD_TEST",
      label: "Upload",
      icon: ArrowUp,
      color: "purple",
      isCompleted: ["PROCESS_RESULTS", "COMPLETED"].includes(phase),
      isActive: phase === "UPLOAD_TEST",
    },
    {
      id: "COMPLETED",
      label: "Results",
      icon: Award,
      color: "teal",
      isCompleted: phase === "COMPLETED",
      isActive: phase === "PROCESS_RESULTS" || phase === "COMPLETED",
    },
  ];

  // Fill reaches the center of each completed step, then advances halfway toward
  // the next in-progress step. Derived from the `steps` array so the fill bar and
  // the step highlighting can never drift apart, and it never extends past an
  // active-but-incomplete step (no progress → fill 0).
  const completedCount = steps.filter((s) => s.isCompleted).length;
  const activeIdx = steps.findIndex((s) => s.isActive);
  const activeIncomplete = activeIdx >= 0 && !steps[activeIdx].isCompleted;
  const fillProgress = Math.min(
    1,
    Math.max(0, (completedCount - (activeIncomplete ? 0.5 : 0)) / (steps.length - 1))
  );

  return (
    <div className="w-full max-w-xl mx-auto py-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting Line Track — spans strictly from the center of the first circle (18px) to the center of the last (18px from right) */}
        <div className="absolute top-[18px] left-[18px] right-[18px] h-0.5 -translate-y-1/2 z-0 overflow-hidden rounded-full">
          {/* Inactive Track */}
          <div className="w-full h-full bg-slate-800 rounded-full" />

          {/* Animated Fill Line */}
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full origin-left"
            style={{
              background: "linear-gradient(90deg, #10b981, #06b6d4, #a855f7)",
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${fillProgress * 100}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 20, mass: 0.8 }}
          />
        </div>

        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={
                  step.isCompleted
                    ? { scale: [1, 1.2, 1], transition: { duration: 0.3 } }
                    : step.isActive
                    ? { scale: [1, 1.08, 1], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
                    : { scale: 1 }
                }
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step.isCompleted
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                    : step.isActive
                    ? "bg-slate-900 border-2 border-cyan-400 text-cyan-400 ring-4 ring-cyan-500/20 shadow-lg shadow-cyan-500/40"
                    : "bg-slate-900 border border-slate-700 text-slate-500"
                }`}
              >
                {step.isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <Icon className={`w-4 h-4 ${step.isActive ? "animate-pulse" : ""}`} />
                )}
              </motion.div>
              <span
                className={`text-[11px] font-semibold tracking-wide uppercase transition-colors ${
                  step.isActive
                    ? "text-cyan-400"
                    : step.isCompleted
                    ? "text-slate-300"
                    : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
