"use client";

import React from "react";
import { Activity, ArrowDown, ArrowUp, Check, Award } from "lucide-react";
import { TestPhase } from "@/types";

interface TestProgressProps {
  phase: TestPhase;
}

export const TestProgress: React.FC<TestProgressProps> = ({ phase }) => {
  const steps = [
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

  return (
    <div className="w-full max-w-xl mx-auto py-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting Line Track */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 -z-0" />

        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5">
              <div
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
              </div>
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
