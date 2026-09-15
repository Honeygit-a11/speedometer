import type { Metadata } from "next";
import Link from "next/link";
import { Gauge, ArrowLeft, ArrowRight, Tv, Gamepad2, Video } from "lucide-react";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "What Is a Good Internet Speed? (2026 Household Guide) — SpeedPulse",
  description:
    "How much download and upload bandwidth do you actually need? Complete bandwidth benchmark for streaming 4K/8K video, competitive gaming, remote work, and multi-user homes.",
};

export default function WhatIsGoodInternetSpeedPage() {
  const tiers = [
    {
      speed: "25 – 50 Mbps",
      audience: "1–2 People",
      icon: Tv,
      color: "text-cyan-400",
      bg: "border-cyan-800/40",
      description: "Ideal for basic web browsing, email, social media, and streaming HD or single 4K video streams.",
    },
    {
      speed: "100 – 300 Mbps",
      audience: "3–4 People (Average Household)",
      icon: Video,
      color: "text-emerald-400",
      bg: "border-emerald-800/40",
      description: "Supports multiple simultaneous 4K streams, Zoom conference calls, large file downloads, and online gaming.",
    },
    {
      speed: "500 – 1000 Mbps (Gigabit)",
      audience: "Heavy Users & Smart Homes",
      icon: Gamepad2,
      color: "text-purple-400",
      bg: "border-purple-800/40",
      description: "Essential for downloading 100GB+ modern games in minutes, 4K livestreaming on Twitch/YouTube, and 20+ IoT smart home devices.",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
      {/* Back Link */}
      <Link
        href="/guides"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Guides</span>
      </Link>

      {/* Header */}
      <PageHeader
        icon={Gauge}
        tone="purple"
        badge="Buyer's Benchmark"
        title="What Is a Good Internet Speed? (2026 Guide)"
        description="ISPs aggressively market gigabit plans that many households do not need, while neglecting critical upload speeds and latency. Here is what bandwidth you actually require."
      />

      {/* Main Content Article */}
      <article className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
        {/* Bandwidth Tiers */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-400 font-mono text-lg">01.</span>
            Recommended Bandwidth by Household Size
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {tiers.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.speed}
                  className={`p-6 rounded-2xl bg-slate-950/60 border ${t.bg} space-y-3 flex flex-col justify-between`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {t.audience}
                      </span>
                      <Icon className={`w-4 h-4 ${t.color}`} />
                    </div>
                    <div className="text-xl font-bold text-white">{t.speed}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{t.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bandwidth vs Latency */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-400 font-mono text-lg">02.</span>
            Bandwidth vs. Latency: Why Speed Isn&apos;t Everything
          </h2>
          <p>
            Many consumers assume that a 1 Gbps plan guarantees zero gaming lag. In reality, bandwidth
            (download/upload capacity) is simply the width of the pipe, whereas <strong>latency (ping)</strong> is
            the speed of light through the fiber cable.
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-slate-400 text-sm">
            <li>
              <strong>Competitive Online Gaming:</strong> Games send tiny coordinate updates requiring only
              1–3 Mbps of bandwidth. However, a ping of 15ms feels crisp and instantaneous, while a ping of 120ms
              feels sluggish regardless of whether you have 50 Mbps or 2,000 Mbps.
            </li>
            <li>
              <strong>Video Conferencing:</strong> Zoom and Teams need only 3–4 Mbps per HD call, but require
              low jitter and low packet loss to prevent robotic voices and video freezes.
            </li>
            <li>
              <strong>Streaming Video:</strong> Netflix 4K requires 15–25 Mbps per stream. Three 4K TVs streaming
              simultaneously require ~75 Mbps total.
            </li>
          </ul>
        </section>

        {/* The Importance of Upload Speed */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-400 font-mono text-lg">03.</span>
            Don&apos;t Overlook Upload Speed
          </h2>
          <p>
            Many cable broadband plans advertise 500 Mbps download but offer a meager 10–20 Mbps upload.
            If multiple family members upload cloud photo backups (Google Photos, iCloud), sync Dropbox files,
            or join video meetings simultaneously, an insufficient upload pipe becomes fully saturated.
          </p>
          <p className="text-sm text-slate-400">
            When your upload bandwidth saturates, TCP ACK packets (acknowledgment receipts for incoming downloads)
            cannot leave your router, causing your 500 Mbps download stream to grind to a halt. Whenever possible,
            favor symmetric fiber connections (e.g., 300/300 Mbps) over asymmetric cable connections (e.g., 500/20 Mbps).
          </p>
        </section>

        {/* CTA Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-slate-400">Curious what your actual bandwidth is right now?</span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-purple-500/20"
          >
            <span>Test Your Connection Speed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </article>
    </div>
  );
}
