import React from "react";
import { SpeedTestContainer } from "@/components/speed-test/SpeedTestContainer";
import { Wifi, ShieldCheck, Zap, Globe2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-10">
        
        {/* Hero Title & Subheading */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 text-xs font-semibold shadow-inner">
            <Wifi className="w-3.5 h-3.5" />
            <span>Independent Edge Network Measurement</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
            Test Your <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Internet Speed</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Real-time, accurate measurements for Download, Upload, Ping, and Jitter directly from your browser to Cloudflare edge nodes.
          </p>
        </div>

        {/* Master Reactive Speed Test Container */}
        <SpeedTestContainer />

        {/* Architectural Highlights */}
        <div className="w-full max-w-3xl pt-8 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Browser-Timed</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Measurements happen directly in your browser without proxying through heavy app servers.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Globe2 className="w-3.5 h-3.5" />
              <span>Cloudflare Edge</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Streams data dynamically through isolated serverless workers on Cloudflare&apos;s global network.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Zero-Storage</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload payloads are consumed in memory and immediately discarded. No databases or tracking.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
