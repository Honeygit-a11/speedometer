import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowLeft, ArrowRight, CheckCircle2, Cpu } from "lucide-react";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Bufferbloat Explained: Why Internet Lags Under Load — SpeedPulse",
  description:
    "Understand bufferbloat, loaded latency spikes during downloads/uploads, and how to fix router queue bloat using Smart Queue Management (SQM).",
};

export default function UnderstandingBufferbloatPage() {
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
        icon={Activity}
        tone="emerald"
        badge="Deep Dive"
        title="Bufferbloat Explained: Why Internet Lags When Busy"
        description="Have you ever had 500 Mbps download speeds but still experienced sudden lag spikes in gaming or frozen Zoom audio when someone started a stream? That is bufferbloat."
      />

      {/* Main Content Article */}
      <article className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
        {/* Definition */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-lg">01.</span>
            What Exactly Is Bufferbloat?
          </h2>
          <p>
            Bufferbloat is high latency caused by excessive buffering of network packets inside routers,
            cable modems, and network switches. When your connection is idle, packets pass through quickly.
            However, when someone begins uploading a file or streaming 4K video, the router receives packets
            faster than it can transmit them over your ISP uplink.
          </p>
          <p>
            Rather than intentionally dropping packets to tell TCP to slow down (the fundamental TCP flow control
            mechanism), dumb FIFO (First In, First Out) queues buffer thousands of packets. This introduces
            hundreds of milliseconds of artificial delay for time-sensitive traffic like gaming, DNS queries,
            and VoIP calls.
          </p>
        </section>

        {/* Real-World Analogy */}
        <section className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            The Highway Tollbooth Analogy
          </h3>
          <p className="text-sm text-slate-400">
            Imagine an express highway lane with an emergency vehicle (your gaming or voice packet)
            trapped behind a massive convoy of 50 freight trucks (a Netflix or Steam download). Even though
            the emergency vehicle only needs a split second to pass, it is stuck waiting for all 50 trucks
            to exit the tollbooth first. That line of waiting trucks is your router&apos;s bloated buffer.
          </p>
        </section>

        {/* How SpeedPulse measures it */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-lg">02.</span>
            How SpeedPulse Grades Bufferbloat
          </h2>
          <p>
            Conventional speed tests only measure idle ping before running transfers. SpeedPulse continuously
            fires latency probes <em>during</em> peak download and upload transfers to calculate <strong>Loaded Latency</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-800/40 space-y-1">
              <div className="text-xs font-bold text-emerald-400 uppercase">Grade A+ / A</div>
              <div className="text-sm font-semibold text-white">+0ms to +15ms spike</div>
              <p className="text-xs text-slate-400">Near-zero lag increase under heavy family usage.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-yellow-800/40 space-y-1">
              <div className="text-xs font-bold text-yellow-400 uppercase">Grade B / C</div>
              <div className="text-sm font-semibold text-white">+20ms to +60ms spike</div>
              <p className="text-xs text-slate-400">Occasional voice stutter or gaming micro-stutters.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-rose-800/40 space-y-1">
              <div className="text-xs font-bold text-rose-400 uppercase">Grade D / F</div>
              <div className="text-sm font-semibold text-white">+100ms to +500ms+ spike</div>
              <p className="text-xs text-slate-400">Severe rubber-banding, game disconnects, frozen video.</p>
            </div>
          </div>
        </section>

        {/* How to Fix Bufferbloat */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-lg">03.</span>
            How to Permanently Fix Bufferbloat
          </h2>
          <p>
            Throwing more raw bandwidth at bufferbloat does <strong>not</strong> solve it — upgrading from 100 Mbps
            to 1 Gbps simply means buffers fill faster. The true solution is active queue management:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-slate-400 text-sm">
            <li>
              <strong>Enable SQM (Smart Queue Management):</strong> In modern routers, look for SQM settings.
              Algorithms like <strong>CAKE</strong> or <strong>FQ-CoDel</strong> (Fair Queueing Controlled Delay)
              automatically prioritize small, interactive packets over bulk data streams.
            </li>
            <li>
              <strong>Cap Bandwidth to 90–95%:</strong> In your router&apos;s QoS or SQM settings, set your download
              and upload caps to roughly 90% to 95% of your measured speed. By preventing your link from reaching
              100% saturation, the modem buffer never fills up, keeping latency flat under any load.
            </li>
            <li>
              <strong>Upgrade to SQM-Capable Hardware:</strong> If your ISP-provided gateway lacks SQM, consider
              placing it into bridge mode and attaching a router running OpenWrt, pfSense, OPNsense, or an
              off-the-shelf router featuring intelligent SQM management.
            </li>
          </ul>
        </section>

        {/* CTA Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-slate-400">Want to see your bufferbloat grade?</span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
          >
            <span>Run Loaded Latency Test</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </article>
    </div>
  );
}
