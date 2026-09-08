import type { Metadata } from "next";
import Link from "next/link";
import { Zap, ShieldCheck, Cpu, Globe2, ArrowRight, Gauge, Activity, Server } from "lucide-react";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "About SpeedPulse — Independent Internet Speed & Quality Testing",
  description:
    "Learn about SpeedPulse: an ad-free, account-free, high-precision internet speed testing platform powered by global edge computing.",
};

export default function AboutPage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16">
      {/* Hero Section */}
      <PageHeader
        icon={Zap}
        badge="Our Mission"
        title="Honest, Ad-Free Speed Testing for the Modern Web"
        description="SpeedPulse was created to solve a widespread problem in internet measurement: bloated, ad-saturated test tools that report artificially inflated peak bursts rather than actual, sustained network capacity."
      />

      {/* Core Pillars Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 space-y-4 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Gauge className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Real Sustained Throughput</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Unlike legacy tools that sample short 2-second bursts, SpeedPulse runs adaptive
            multi-stream transfers that discard warm-up TCP slow-start and measure your true
            sustainable bandwidth.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 space-y-4 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Absolute Zero Logging</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            No tracking cookies, no accounts, and no data profiling. In-flight upload chunks are
            consumed directly into memory and immediately discarded. Nothing is ever written to disk.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 space-y-4 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Edge-First Architecture</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            By leveraging lightweight edge runtimes and dedicated streaming engines, testing occurs
            at the network edge closest to you, providing sub-millisecond precision.
          </p>
        </div>
      </section>

      {/* Deep Dive Section */}
      <section className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Why We Built SpeedPulse
          </h2>
          <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
            Internet service providers often prioritize the first few packets of a connection (power
            boost) to trick simple tests into showing top speeds. When you stream video, game, or
            make video calls, your connection operates over minutes or hours. SpeedPulse measures:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Bufferbloat & Loaded Latency</h3>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                How much does your latency spike when someone in your home is downloading a large file?
                We measure loaded latency to detect router bufferbloat.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Jitter & Connection Stability</h3>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                High speed is meaningless if packets arrive irregularly. We compute RFC 3550 statistical
                jitter to evaluate VoIP, conferencing, and gaming stability.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-purple-400 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Distributed Server Failover</h3>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Automatic multi-candidate ping ranking ensures your test uses the most responsive
                node, gracefully failing over if a server drops.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Adaptive Connection Scaling</h3>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Dynamic concurrency scaling (from 2 up to 16 parallel sockets) fully saturates high-speed
                fiber connections without choking slower networks.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-slate-400">Ready to test your connection?</span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20"
          >
            <span>Launch Speed Test</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
