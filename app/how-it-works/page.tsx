import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Activity, Download, Upload, Cpu, ShieldAlert, CheckCircle2, Server } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works — SpeedPulse Measurement Engine",
  description:
    "Explore the technical engineering behind SpeedPulse: adaptive parallel streaming, RFC 3550 jitter calculations, zero-retention upload sinks, and bufferbloat diagnostics.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      step: "01",
      title: "Server Discovery & Latency Ranking",
      icon: Server,
      color: "text-cyan-400",
      bg: "bg-cyan-950/60 border-cyan-800/60",
      description:
        "The test begins by reading configured test server candidates (Cloudflare Edge nodes and dedicated streaming backends). SpeedPulse dispatches multiple concurrent ping probes to each server, measuring round-trip latency and selecting the lowest-latency healthy node.",
    },
    {
      step: "02",
      title: "Ping & Statistical Jitter (RFC 3550)",
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-950/60 border-emerald-800/60",
      description:
        "Sequential micro-payload HTTP round-trips measure baseline idle latency. Jitter is computed using the international RFC 3550 formula: J(i) = J(i-1) + (|D(i-1, i)| - J(i-1)) / 16, measuring packet arrival timing variance critical for gaming and voice calls.",
    },
    {
      step: "03",
      title: "Progressive Download Streaming",
      icon: Download,
      color: "text-blue-400",
      bg: "bg-blue-950/60 border-blue-800/60",
      description:
        "The engine opens keep-alive streams requesting uncompressible binary data directly from the server. To avoid slow-start distortions, the initial 1.5 seconds are treated as warm-up and discarded. Streams scale dynamically (from 2 up to 16 parallel sockets) to saturate the bandwidth pipe.",
    },
    {
      step: "04",
      title: "Server-Confirmed Upload Testing",
      icon: Upload,
      color: "text-purple-400",
      bg: "bg-purple-950/60 border-purple-800/60",
      description:
        "The client generates synthetic random binary chunks in browser memory and streams them to the server's upload sink. Crucially, bytes are only credited when the server explicitly confirms receipt, preventing browser buffer-fill from inflating the reported speed.",
    },
    {
      step: "05",
      title: "Loaded Latency & Bufferbloat Analysis",
      icon: Cpu,
      color: "text-pink-400",
      bg: "bg-pink-950/60 border-pink-800/60",
      description:
        "While download and upload transfers run at maximum capacity, SpeedPulse fires background latency probes. The difference between idle latency and loaded latency reveals your Bufferbloat grade (A+ through F), showing whether your router buffers packets excessively.",
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16">
      {/* Header */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5" />
          <span>Measurement Engineering</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          How SpeedPulse Measures Network Performance
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          SpeedPulse does not rely on synthetic animations or flash bursts. Learn how our headless
          engine measures real TCP throughput, packet latency, and bufferbloat.
        </p>
      </section>

      {/* Measurement Pipeline Timeline */}
      <section className="space-y-8">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">The 5-Stage Measurement Pipeline</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Every test strictly follows an automated lifecycle designed for scientific consistency.
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center gap-6 relative group hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-2xl sm:text-3xl font-black text-slate-600 font-mono">
                    {s.step}
                  </span>
                  <div className={`w-12 h-12 rounded-xl ${s.bg} border flex items-center justify-center ${s.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-1.5 flex-1">
                  <h3 className="text-lg font-bold text-white">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Anti-Inflation Rules Card */}
      <section className="glass-panel p-8 sm:p-10 rounded-3xl border border-cyan-900/40 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/20 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Our Strict Anti-Inflation Standards
            </h2>
            <p className="text-xs text-slate-400">Why our results reflect true ISP performance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Warm-Up Exclusion</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                The first 1,500ms of data transfers are discarded to prevent initial TCP handshake
                delays from skewing your average downward.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">No Peak Spikes as Final Speed</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                Some tools record the single highest 100ms spike. SpeedPulse calculates the sustained
                post-warmup throughput across hundreds of continuous samples.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">No Browser Cache Interference</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                Every chunk request includes cache-busting headers (`no-store`, `no-cache`, timestamp
                tokens) and generates unique random bytes so CDNs cannot serve cached data.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Frozen Concurrency Post-Warmup</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                Stream concurrency ramps up during warm-up only and freezes during measurement,
                preventing mid-test connection creation spikes.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
          >
            <span>Try It Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
