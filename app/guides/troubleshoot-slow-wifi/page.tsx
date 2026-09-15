import type { Metadata } from "next";
import Link from "next/link";
import { Wifi, ArrowLeft, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "How to Troubleshoot & Fix Slow Home Wi-Fi — SpeedPulse Guide",
  description:
    "A comprehensive step-by-step tutorial on fixing slow Wi-Fi speeds, channel congestion, dead zones, and router placement.",
};

export default function TroubleshootWifiPage() {
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
        icon={Wifi}
        tone="cyan"
        badge="Troubleshooting Manual"
        title="How to Troubleshoot & Fix Slow Home Wi-Fi"
        description="Wi-Fi signal degradation is the #1 reason speed tests fail to reach advertised ISP speeds. Here is how to diagnose and resolve wireless bottlenecks."
      />

      {/* Main Content Article */}
      <article className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
        {/* Step 1: Wired vs Wireless Isolation */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-lg">01.</span>
            Isolate the Problem: Wired vs. Wi-Fi
          </h2>
          <p>
            Before changing router settings or calling your ISP, establish a clean performance baseline.
            Plug a laptop or desktop computer directly into one of your router&apos;s LAN ports using a
            Cat6 or Cat5e Ethernet cable and run a test on{" "}
            <Link href="/" className="text-cyan-400 hover:underline">
              SpeedPulse
            </Link>.
          </p>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-sm">
            <p>
              <strong>Case A:</strong> If the wired connection delivers your full advertised ISP speed,
              your ISP connection is healthy — the bottleneck is entirely within your local Wi-Fi environment.
            </p>
            <p>
              <strong>Case B:</strong> If the wired connection is also significantly below speed, the issue
              stems from modem synchronization, upstream ISP line degradation, or router CPU exhaustion.
            </p>
          </div>
        </section>

        {/* Step 2: 2.4 GHz vs 5 GHz vs 6 GHz */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-lg">02.</span>
            Switch from 2.4 GHz to 5 GHz or 6 GHz
          </h2>
          <p>
            Many standard consumer routers combine both 2.4 GHz and 5 GHz frequency bands under a single
            network name (SSID) via &quot;Smart Connect&quot; or band steering. In practice, devices often get
            stuck on the slower 2.4 GHz band.
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-slate-400 text-sm">
            <li>
              <strong>2.4 GHz:</strong> Travels further through walls, but caps out around 50–90 Mbps in real-world
              conditions due to heavy interference from microwaves, Bluetooth devices, and neighbor networks.
            </li>
            <li>
              <strong>5 GHz (Wi-Fi 5 / Wi-Fi 6):</strong> Easily delivers 300–800 Mbps with lower latency, but has
              shorter physical range through dense concrete or brick walls.
            </li>
            <li>
              <strong>6 GHz (Wi-Fi 6E / Wi-Fi 7):</strong> Pristine spectrum with zero legacy device contention,
              capable of multi-gigabit throughput in line-of-sight environments.
            </li>
          </ul>
          <p className="text-xs text-slate-400 italic">
            Tip: Log in to your router admin portal (typically 192.168.1.1 or 192.168.0.1) and separate your SSIDs
            into &quot;HomeNetwork_5G&quot; and &quot;HomeNetwork_2.4G&quot; to ensure your high-bandwidth devices stay on 5 GHz.
          </p>
        </section>

        {/* Step 3: Optimal Router Placement */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-lg">03.</span>
            Optimize Physical Router Placement
          </h2>
          <p>
            Wi-Fi radio waves emit in a toroidal (donut-shaped) pattern. Placing your router on the floor,
            tucked inside a closed wooden cabinet, or next to metal appliances severely attenuates the signal.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Do</div>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Elevate the router 4 to 6 feet off the floor.</li>
                <li>Position it centrally within your floor plan.</li>
                <li>Keep antennas oriented perpendicular to each other.</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Avoid</div>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Placing behind televisions or metal bookshelves.</li>
                <li>Placing near microwave ovens or baby monitors.</li>
                <li>Basement placement for multi-story homes.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Step 4: Wi-Fi Channel Selection */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-lg">04.</span>
            Change Congested Wi-Fi Channels
          </h2>
          <p>
            In apartment complexes and urban neighborhoods, dozens of routers broadcast on identical default
            frequencies. Use a free Wi-Fi analyzer app (such as Wi-Fi Analyzer on Android or Airport Utility on iOS)
            to scan for local frequency overlap.
          </p>
          <p className="text-sm text-slate-400">
            For 2.4 GHz, use non-overlapping channels only: <strong>1, 6, or 11</strong>. For 5 GHz, choose channels
            with the lowest observed neighbor broadcasts (channels 36–48 or 149–161).
          </p>
        </section>

        {/* Step 5: Router Restarts & Firmware */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-lg">05.</span>
            Reboot Hardware and Update Firmware
          </h2>
          <p>
            Modern routers are specialized computers running Linux-based operating systems with dedicated RAM and
            CPUs. Over months of uptime, memory leaks and stale connection tracking tables (NAT state tables)
            degrade throughput. A simple 30-second power cycle clears volatile RAM. Additionally, check for router
            firmware updates to address known Wi-Fi driver bugs.
          </p>
        </section>

        {/* Interactive CTA */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-slate-400">Applied these adjustments? Re-test your network:</span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20"
          >
            <span>Run Speed Test</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </article>
    </div>
  );
}
