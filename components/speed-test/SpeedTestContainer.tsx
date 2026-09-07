"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpeedTestState } from "@/types";
import { speedTestController } from "@/features/speed-test/engine/test-controller";
import { SpeedMeter } from "./SpeedMeter";
import { SpeedDisplay } from "./SpeedDisplay";
import { TestProgress } from "./TestProgress";
import { MetricCard } from "./MetricCard";
import { Results } from "./Results";
import { ArrowDown, ArrowUp, Activity, Play, AlertCircle, RotateCcw, XCircle, Server, Loader2 } from "lucide-react";
import { formatLatency, formatSpeed } from "@/lib/utils";
import { Aurora } from "@/components/ui";

const phaseVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 1.02, y: -10 },
};

export const SpeedTestContainer: React.FC = () => {
  const [state, setState] = useState<SpeedTestState>(() => speedTestController.getState());

  useEffect(() => {
    const unsubscribe = speedTestController.subscribe((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  const workerUrl = process.env.NEXT_PUBLIC_SPEEDTEST_WORKER_URL || "http://127.0.0.1:8787";

  const handleStartTest = useCallback(async () => {
    try {
      await speedTestController.start({
        workerUrl,
        pingProbes: 6,
        downloadDurationMs: 8000,
        uploadDurationMs: 8000,
        warmupMs: 1500,
      });
    } catch (err) {
      console.error("[SpeedTest UI] Test failed or was cancelled:", err);
    }
  }, [workerUrl]);

  const handleCancelTest = useCallback(() => {
    speedTestController.cancel();
  }, []);

  const handleReset = useCallback(() => {
    speedTestController.reset();
  }, []);

  const isTesting = [
    "INITIALIZING",
    "PING_TEST",
    "DOWNLOAD_TEST",
    "UPLOAD_TEST",
    "PROCESS_RESULTS",
  ].includes(state.phase);

  const activeSpeed =
    state.phase === "DOWNLOAD_TEST"
      ? state.download.currentMbps
      : state.phase === "UPLOAD_TEST"
      ? state.upload.currentMbps
      : 0;

  const activeTransferred =
    state.phase === "DOWNLOAD_TEST"
      ? state.download.bytesTransferred
      : state.phase === "UPLOAD_TEST"
      ? state.upload.bytesTransferred
      : 0;

  const glowColor =
    state.phase === "DOWNLOAD_TEST"
      ? "rgba(6, 182, 212, 0.15)"
      : state.phase === "UPLOAD_TEST"
      ? "rgba(168, 85, 247, 0.15)"
      : state.phase === "COMPLETED"
      ? "rgba(16, 185, 129, 0.15)"
      : "rgba(6, 182, 212, 0.1)";

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center space-y-8">
      <Aurora className="opacity-40" />

      {/* Test Stage Timeline (Visible during testing or when completed) */}
      {state.phase !== "IDLE" && state.phase !== "CANCELLED" && state.phase !== "ERROR" && (
        <TestProgress phase={state.phase} />
      )}

      {/* Main Interactive Stage Container */}
      <div className="w-full max-w-2xl p-6 sm:p-10 rounded-3xl glass-panel glass-panel-glow flex flex-col items-center justify-center relative overflow-hidden min-h-[380px]">
        {/* Ambient Backlight Glow — animated via Framer Motion */}
        <motion.div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          animate={{ backgroundColor: glowColor }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        />

        <AnimatePresence mode="wait">
          {/* 1. READY / IDLE STATE */}
          {state.phase === "IDLE" && (
            <motion.div
              key="idle"
              variants={phaseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center space-y-6 py-6"
            >
              <motion.button
                id="start-speedtest-btn"
                onClick={handleStartTest}
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(6, 182, 212, 0.4)" }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-slate-900 border-2 border-cyan-500/40 hover:border-cyan-400 p-2 shadow-2xl shadow-cyan-500/20 transition-colors duration-300 flex flex-col items-center justify-center cursor-pointer"
              >
                <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 group-hover:opacity-100 opacity-60 transition-opacity" />
                <div className="relative z-10 flex flex-col items-center space-y-1">
                  <Play className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform fill-cyan-400/20" />
                  <span className="text-xl sm:text-2xl font-extrabold text-white tracking-wider uppercase">
                    GO
                  </span>
                </div>
              </motion.button>

              <div className="text-center space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-200">
                  Start Speed Test
                </h2>
                <p className="text-xs text-slate-400">
                  Click GO to begin real-time latency, download, and upload measurement
                </p>
              </div>
            </motion.div>
          )}

          {/* 2. INITIALIZING STATE */}
          {state.phase === "INITIALIZING" && (
            <motion.div
              key="init"
              variants={phaseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center space-y-4 py-16"
            >
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white">Connecting to Edge Infrastructure</h3>
                <p className="text-xs text-slate-400">Preparing low-latency test streams...</p>
              </div>
            </motion.div>
          )}

          {/* 3. PING TEST STATE */}
          {state.phase === "PING_TEST" && (
            <motion.div
              key="ping"
              variants={phaseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center space-y-6 py-8"
            >
              <div className="relative w-44 h-44 rounded-full border-2 border-dashed border-emerald-500/40 flex flex-col items-center justify-center bg-slate-950/60 shadow-inner">
                <div className="absolute inset-2 rounded-full border border-emerald-500/20 animate-pulse" />
                <Activity className="w-10 h-10 text-emerald-400 mb-2 animate-bounce" />
                <span className="text-4xl font-extrabold text-white">
                  {formatLatency(state.ping.currentPing)}
                </span>
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mt-0.5">
                  ms
                </span>
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white">Measuring Latency & Jitter</h3>
                <p className="text-xs text-slate-400">Sampling round-trip network response...</p>
              </div>
            </motion.div>
          )}

          {/* 4 & 5. DOWNLOAD AND UPLOAD TEST STATES */}
          {(state.phase === "DOWNLOAD_TEST" || state.phase === "UPLOAD_TEST") && (
            <motion.div
              key={state.phase}
              variants={phaseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center space-y-2 py-2"
            >
              <div className="relative flex items-center justify-center">
                <SpeedMeter
                  currentMbps={activeSpeed}
                  phase={state.phase}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-14">
                  <SpeedDisplay
                    speedMbps={activeSpeed}
                    phase={state.phase}
                    bytesTransferred={activeTransferred}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* 6. PROCESS RESULTS STATE */}
          {state.phase === "PROCESS_RESULTS" && (
            <motion.div
              key="process"
              variants={phaseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center space-y-4 py-16"
            >
              <div className="w-16 h-16 rounded-2xl bg-teal-950/60 border border-teal-800/40 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white">Finalizing Measurement</h3>
                <p className="text-xs text-slate-400">Computing stabilized results and jitter...</p>
              </div>
            </motion.div>
          )}

          {/* 7. COMPLETED STATE */}
          {state.phase === "COMPLETED" && state.results && (
            <motion.div
              key="completed"
              variants={phaseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <Results results={state.results} onRestart={handleReset} />
            </motion.div>
          )}

          {/* 8. ERROR STATE */}
          {state.phase === "ERROR" && (
            <motion.div
              key="error"
              variants={phaseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center space-y-4 py-10 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/20">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-bold text-white">Measurement Error</h3>
                <p className="text-xs text-rose-300">
                  {state.error || "Network connection interrupted or edge worker unreachable."}
                </p>
              </div>
              <button
                id="retry-error-btn"
                onClick={handleReset}
                className="px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </motion.div>
          )}

          {/* 9. CANCELLED STATE */}
          {state.phase === "CANCELLED" && (
            <motion.div
              key="cancelled"
              variants={phaseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center space-y-4 py-10 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                <XCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Test Cancelled</h3>
                <p className="text-xs text-slate-400">The speed test was stopped before completion.</p>
              </div>
              <button
                id="retry-cancelled-btn"
                onClick={handleReset}
                className="px-6 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Run Test Again</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Test Cancellation Trigger */}
        {isTesting && (
          <button
            id="cancel-test-btn"
            onClick={handleCancelTest}
            className="mt-4 text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel Test</span>
          </button>
        )}
      </div>

      {/* Real-Time Metrics Grid (Always visible for at-a-glance telemetry) */}
      <motion.div
        className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        <MetricCard
          title="Download"
          value={
            state.results
              ? state.results.downloadSpeed
              : state.phase === "DOWNLOAD_TEST"
              ? formatSpeed(state.download.currentMbps)
              : state.download.finalMbps > 0
              ? formatSpeed(state.download.finalMbps)
              : "--"
          }
          unit="Mbps"
          icon={ArrowDown}
          colorScheme="cyan"
          isActive={state.phase === "DOWNLOAD_TEST"}
        />

        <MetricCard
          title="Upload"
          value={
            state.results
              ? state.results.uploadSpeed
              : state.phase === "UPLOAD_TEST"
              ? formatSpeed(state.upload.currentMbps)
              : state.upload.finalMbps > 0
              ? formatSpeed(state.upload.finalMbps)
              : "--"
          }
          unit="Mbps"
          icon={ArrowUp}
          colorScheme="purple"
          isActive={state.phase === "UPLOAD_TEST"}
        />

        <MetricCard
          title="Ping"
          value={
            state.results
              ? state.results.ping
              : state.ping.avgPing > 0
              ? Math.round(state.ping.avgPing)
              : state.ping.currentPing > 0
              ? Math.round(state.ping.currentPing)
              : "--"
          }
          unit="ms"
          icon={Activity}
          colorScheme="emerald"
          isActive={state.phase === "PING_TEST"}
        />

        <MetricCard
          title="Jitter"
          value={
            state.results
              ? state.results.jitter
              : state.jitter.jitter > 0
              ? state.jitter.jitter
              : "--"
          }
          unit="ms"
          icon={Server}
          colorScheme="amber"
          isActive={state.phase === "PING_TEST"}
        />
      </motion.div>
    </div>
  );
};
