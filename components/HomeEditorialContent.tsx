"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ChevronDown,
  Cpu,
  Download,
  Gamepad2,
  HelpCircle,
  Laptop,
  Radio,
  Server,
  ShieldCheck,
  Tv,
  Upload,
  Zap,
} from "lucide-react";

export const HomeEditorialContent: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const metrics = [
    {
      name: "Download Speed",
      unit: "Mbps",
      icon: Download,
      color: "text-cyan-400",
      border: "border-cyan-800/40",
      description:
        "The rate at which data is transferred from edge servers to your local device. Crucial for streaming 4K video, downloading software updates, and fast page loads.",
      ideal: "100+ Mbps for 3-4 person homes",
    },
    {
      name: "Upload Speed",
      unit: "Mbps",
      icon: Upload,
      color: "text-purple-400",
      border: "border-purple-800/40",
      description:
        "The speed at which data travels from your device to the internet. Dictates video conferencing smoothness, cloud photo syncing, and live streaming performance.",
      ideal: "20+ Mbps (Cable) / 100+ Mbps (Fiber)",
    },
    {
      name: "Ping (Latency)",
      unit: "ms",
      icon: Activity,
      color: "text-emerald-400",
      border: "border-emerald-800/40",
      description:
        "The round-trip delay in milliseconds for a packet to reach the edge node and return. Low ping is the single most important factor for competitive online gaming.",
      ideal: "< 25 ms (Excellent) / < 50 ms (Good)",
    },
    {
      name: "RFC 3550 Jitter",
      unit: "ms",
      icon: Zap,
      color: "text-yellow-400",
      border: "border-yellow-800/40",
      description:
        "The statistical variance between consecutive ping probes. High jitter causes packet reordering, audio stutter in Zoom/Discord, and gaming rubber-banding.",
      ideal: "< 3 ms (Stable)",
    },
    {
      name: "Bufferbloat (Loaded Ping)",
      unit: "Grade A+ to F",
      icon: Cpu,
      color: "text-pink-400",
      border: "border-pink-800/40",
      description:
        "Measures how much latency spikes when your network is actively downloading or uploading. Unmanaged router buffers cause severe lag under family usage.",
      ideal: "Grade A or A+",
    },
  ];

  const activities = [
    {
      activity: "4K & 8K Ultra HD Streaming",
      bandwidth: "25 – 50 Mbps per stream",
      ping: "< 80 ms",
      importance: "High download bandwidth; latency has minimal impact due to video buffering.",
      icon: Tv,
    },
    {
      activity: "Competitive Esports Gaming",
      bandwidth: "5 – 10 Mbps",
      ping: "< 30 ms",
      importance: "Extremely sensitive to ping and jitter; requires near-zero bufferbloat.",
      icon: Gamepad2,
    },
    {
      activity: "Remote Work & HD Video Meetings",
      bandwidth: "15 – 30 Mbps symmetric",
      ping: "< 50 ms",
      importance: "Requires stable upload speeds (≥10 Mbps) and low jitter to prevent audio dropouts.",
      icon: Laptop,
    },
    {
      activity: "Cloud Backups & Large File Sync",
      bandwidth: "50 – 200+ Mbps upload",
      ping: "Any",
      importance: "Benefits dramatically from symmetric fiber connections to avoid all-day syncs.",
      icon: Server,
    },
  ];

  const faqs = [
    {
      q: "What is the difference between Mbps and MB/s?",
      a: "Internet Service Providers advertise speeds in Megabits per second (Mbps), while operating systems show file downloads in Megabytes per second (MB/s). Because there are 8 bits in a byte, divide your Mbps result by 8: a 400 Mbps connection will download files at roughly 50 MB/s under ideal conditions.",
    },
    {
      q: "Why does SpeedPulse show a different speed than my ISP's advertised plan?",
      a: "ISPs advertise theoretical maximum 'burst' speeds under lab conditions. Real-world speeds vary due to Wi-Fi distance, physical walls, active devices on your home network, router CPU limitations, and upstream ISP transit congestion during peak evening hours. SpeedPulse measures true sustained end-to-end throughput rather than inflated momentary bursts.",
    },
    {
      q: "How can I get the most accurate speed test result?",
      a: "For maximum precision: (1) Connect your computer directly to your router with an Ethernet cable; (2) Temporarily pause background file downloads, video streams, or torrent clients; (3) Disconnect VPN software which can introduce artificial routing overhead; (4) Run tests at different times of the day to see peak vs. off-peak performance.",
    },
    {
      q: "What is bufferbloat and how do I fix it?",
      a: "Bufferbloat occurs when routers over-buffer packets during heavy downloads or uploads instead of regulating flow, causing massive latency spikes (lag). To fix it, enable Smart Queue Management (SQM) with CAKE or FQ-CoDel in your router settings, or set bandwidth caps to 90-95% of your maximum speed.",
    },
    {
      q: "Does SpeedPulse store my IP address or test history?",
      a: "No. SpeedPulse adheres to an uncompromising Zero-Retention architectural policy. We do not require accounts, we do not set tracking cookies, and upload test payloads are absorbed in volatile server RAM and immediately discarded. No personal diagnostic profile is ever created.",
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-20 pt-10 text-left">
      {/* SECTION 1: Core Metrics Grid */}
      <section className="space-y-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>Network Diagnostics Anatomy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Understanding Your Internet Speed Test Metrics
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            A high-speed connection is more than just raw download numbers. Discover how each metric
            shapes your daily streaming, gaming, and remote work experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.name}
                className={`p-6 rounded-2xl glass-panel border ${m.border} space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${m.color}`} />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                      {m.unit}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{m.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span className="text-slate-500 font-semibold">Benchmark:</span> {m.ideal}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: Bandwidth Requirements Matrix */}
      <section className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-400 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5" />
            <span>Usage Guidelines</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            What Internet Speed Do You Actually Need?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Different online applications prioritize bandwidth, latency, or packet stability.
            Compare your results with standard real-world usage thresholds:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {activities.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.activity}
                className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{a.activity}</h4>
                    <span className="text-xs text-cyan-400 font-semibold">{a.bandwidth}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Target Latency:</span>
                    <span className="text-slate-300 font-mono">{a.ping}</span>
                  </div>
                  <p className="pt-1 text-slate-400 leading-normal">{a.importance}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <Link
            href="/guides/what-is-good-internet-speed"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>Read full household bandwidth planning guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* SECTION 3: Step-by-Step Testing & Optimization Guide */}
      <section className="space-y-6">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How to Get the Most Accurate Test Results
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Follow these essential testing practices to eliminate false slowdowns and pinpoint true ISP capacity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <span className="text-2xl font-black text-cyan-500 font-mono">01</span>
            <h3 className="text-base font-bold text-white">Use a Wired Cable</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Wi-Fi signals degrade through walls and suffer radio interference. Whenever possible,
              connect directly to your router with an Ethernet cable to establish an optimal baseline.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <span className="text-2xl font-black text-emerald-500 font-mono">02</span>
            <h3 className="text-base font-bold text-white">Halt Background Traffic</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cloud backups (iCloud/Dropbox), Steam game downloads, streaming smart TVs, and active
              torrents consume socket bandwidth and inflate your measured loaded latency.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <span className="text-2xl font-black text-purple-500 font-mono">03</span>
            <h3 className="text-base font-bold text-white">Disable VPN Layers</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Virtual Private Networks encrypt packets and route traffic through intermediary servers,
              which adds overhead and limits speeds to the VPN provider&apos;s tunnel throughput.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: Homepage FAQ Accordion */}
      <section className="space-y-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Quick answers to standard questions about internet speeds, measurement accuracy, and privacy.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="rounded-2xl glass-panel border border-slate-800/80 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 text-white font-semibold text-sm sm:text-base hover:text-cyan-300 transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-cyan-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-4 animate-in fade-in-50 duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center sm:text-left">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>View complete glossary & technical FAQ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* SECTION 5: Trust Banner */}
      <section className="glass-panel p-8 sm:p-10 rounded-3xl border border-cyan-900/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Zero-Retention Speed Diagnostics</span>
          </div>
          <h3 className="text-xl font-bold text-white">Built for Honest, Independent Measurement</h3>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            SpeedPulse runs without invasive ads, tracking scripts, or data monetization. Explore our
            open-source architectural methodology and privacy commitments.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/how-it-works"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/about"
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 transition-colors"
          >
            About Us
          </Link>
        </div>
      </section>
    </div>
  );
};
