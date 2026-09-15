import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Disclaimer — SpeedPulse Network Testing Terms",
  description:
    "Important disclosures regarding the informational nature of internet speed test results, measurement variances, and data usage on SpeedPulse.",
};

export default function DisclaimerPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
      {/* Header */}
      <PageHeader
        icon={AlertTriangle}
        tone="amber"
        center={false}
        badge="Legal & Technical Notice"
        title="Speed Test Disclaimer"
        description="Last Updated: March 2026 · Please review this notice regarding measurement precision, environmental factors, and data consumption."
      />

      {/* Primary Highlight Box */}
      <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-amber-800/40 bg-amber-950/10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
            <Info className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            Informational & Diagnostic Purpose Only
          </h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          SpeedPulse provides web-based internet connection performance estimates for diagnostic,
          troubleshooting, and informational purposes only. Results do not constitute a certified
          telecommunications audit, legal warranty, or binding service level agreement (SLA) contract.
        </p>
      </section>

      {/* Detailed Articles */}
      <article className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
        {/* Section 1: Measurement Variances */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            1. Why Test Results Vary
          </h3>
          <p>
            Internet speeds reported by SpeedPulse reflect real-time end-to-end throughput between
            your browser and a selected edge test server at the exact moment of execution. Many factors
            outside our control can cause measured speeds to differ from the advertised bandwidth tier
            provided by your Internet Service Provider (ISP):
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-slate-400 text-sm">
            <li>
              <strong>Wi-Fi Signal Degradation:</strong> Wireless interference from physical walls,
              floors, household appliances, or neighboring radio networks frequently reduces speeds
              by 30% to 70% compared to a direct Ethernet cable connection.
            </li>
            <li>
              <strong>Local Network Contention:</strong> Other devices on your local network streaming
              high-definition video, playing multiplayer games, or downloading software updates
              compete directly for available bandwidth during the test.
            </li>
            <li>
              <strong>Router & Device Hardware Limits:</strong> Older router processors, legacy Wi-Fi
              chips (802.11n or older), thermal throttling, or antivirus packet-inspection firewalls
              can bottleneck high-throughput fiber connections.
            </li>
            <li>
              <strong>Upstream ISP Routing & Peering:</strong> Congestion at regional Internet Exchange
              Points (IXPs) or transit providers between your ISP and our edge node can alter latency
              and throughput during peak evening traffic hours.
            </li>
          </ul>
        </section>

        {/* Section 2: Data Usage Notice */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            2. High Bandwidth & Data Consumption Notice
          </h3>
          <p>
            To accurately saturate multi-gigabit connections and measure sustainable throughput,
            SpeedPulse initiates concurrent binary streaming sockets. A single comprehensive test
            may consume:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-center">
              <div className="text-xs text-slate-400 font-medium uppercase">Standard (10-50 Mbps)</div>
              <div className="text-lg font-bold text-white">~30 MB – 100 MB</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-center">
              <div className="text-xs text-slate-400 font-medium uppercase">Broadband (100-500 Mbps)</div>
              <div className="text-lg font-bold text-white">~150 MB – 450 MB</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-center">
              <div className="text-xs text-slate-400 font-medium uppercase">Gigabit (1 Gbps+)</div>
              <div className="text-lg font-bold text-white">~500 MB – 1.2 GB</div>
            </div>
          </div>
          <p className="text-xs text-slate-400 pt-2">
            If you are accessing SpeedPulse on a cellular mobile data plan, satellite internet, or
            metered broadband with a monthly cap, any data overage charges assessed by your carrier
            remain solely your responsibility.
          </p>
        </section>

        {/* Section 3: No Warranty */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
            3. Limitation of Liability & No Warranty
          </h3>
          <p>
            SpeedPulse is provided &quot;as is&quot; without express or implied warranty of any kind.
            We make no representations or warranties regarding uninterrupted availability, edge node
            uptime, or suitability for formal regulatory compliance filings. Under no circumstances
            shall SpeedPulse, its maintainers, or hosting affiliates be liable for damages, data
            loss, or contractual disputes between you and your Internet Service Provider.
          </p>
        </section>

        {/* Section 4: Third-Party Trademarks */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            4. Independent Tool & Trademark Acknowledgement
          </h3>
          <p>
            SpeedPulse is an independent diagnostic utility. Any company names, brand logos, or
            commercial service marks referenced on this website (such as ISP names or cloud providers)
            are the property of their respective trademark owners and are used strictly for identification
            and comparison purposes.
          </p>
        </section>

        {/* CTA Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-400">Questions regarding these terms?</span>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy-policy"
              className="text-xs text-slate-300 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition-colors"
            >
              <span>Contact Support</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
