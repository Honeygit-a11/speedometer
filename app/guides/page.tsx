import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowRight, Activity, Wifi, Gauge, Clock, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Internet Performance Guides & Tutorials — SpeedPulse",
  description:
    "Expert technical guides on optimizing home Wi-Fi, diagnosing bufferbloat, understanding network latency, and choosing the right internet bandwidth.",
};

export default function GuidesIndexPage() {
  const guides = [
    {
      slug: "troubleshoot-slow-wifi",
      title: "How to Troubleshoot & Fix Slow Home Wi-Fi",
      category: "Troubleshooting",
      readTime: "6 min read",
      icon: Wifi,
      color: "text-cyan-400",
      borderColor: "hover:border-cyan-500/50",
      bgBadge: "bg-cyan-950/60 border-cyan-800/60 text-cyan-400",
      summary:
        "Learn step-by-step how to isolate Wi-Fi interference, reposition your router, optimize 2.4 GHz vs 5 GHz vs 6 GHz bands, and eliminate local bottlenecks.",
    },
    {
      slug: "understanding-bufferbloat",
      title: "Bufferbloat Explained: Why Your Internet Lags When Busy",
      category: "Network Engineering",
      readTime: "8 min read",
      icon: Activity,
      color: "text-emerald-400",
      borderColor: "hover:border-emerald-500/50",
      bgBadge: "bg-emerald-950/60 border-emerald-800/60 text-emerald-400",
      summary:
        "A deep dive into router queue bloat, loaded latency, and how Smart Queue Management (SQM) like CAKE and FQ-CoDel permanently fixes gaming lag and Zoom freezes.",
    },
    {
      slug: "what-is-good-internet-speed",
      title: "What Is a Good Internet Speed? (2026 Household Guide)",
      category: "Buyer's Guide",
      readTime: "7 min read",
      icon: Gauge,
      color: "text-purple-400",
      borderColor: "hover:border-purple-500/50",
      bgBadge: "bg-purple-950/60 border-purple-800/60 text-purple-400",
      summary:
        "Determine the exact download and upload bandwidth you need based on household device count, 4K streaming, cloud backups, and competitive multiplayer gaming.",
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
      {/* Header */}
      <PageHeader
        icon={BookOpen}
        tone="blue"
        badge="Knowledge & Tutorials"
        title="Internet Performance Guides"
        description="Comprehensive, peer-reviewed engineering tutorials and troubleshooting manuals to help you understand your connection and get the most out of your network."
      />

      {/* Guide Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {guides.map((g) => {
          const Icon = g.icon;
          return (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className={`glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/80 ${g.borderColor} flex flex-col justify-between space-y-6 transition-all duration-300 group hover:-translate-y-1`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${g.bgBadge}`}>
                    {g.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{g.readTime}</span>
                  </div>
                </div>

                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <Icon className={`w-6 h-6 ${g.color}`} />
                </div>

                <h2 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {g.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {g.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                <span>Read Full Guide</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </section>

      {/* Trust & Diagnostic Callout */}
      <section className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Ad-Free Diagnostic Standards</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              All guides are written without sponsored affiliate hardware bias. Our recommendations
              are based on open RFC standards, real-world packet inspection, and verifiable network physics.
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition-colors shrink-0"
        >
          <span>Run Speed Test</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>
    </div>
  );
}
