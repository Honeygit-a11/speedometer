import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — SpeedPulse",
  description:
    "Answers to common questions about internet speeds, Mbps vs MB/s, latency, jitter, bufferbloat, and how SpeedPulse tests your connection.",
};

export default function FaqPage() {
  const faqs = [
    {
      category: "Speed & Bandwidth",
      items: [
        {
          q: "What is the difference between Mbps and MB/s?",
          a: "Mbps stands for Megabits per second (used by ISPs and network tools to measure transmission speed). MB/s stands for Megabytes per second (used by your operating system when saving files). Since 1 Byte = 8 Bits, a 100 Mbps connection downloads a file at approximately 12.5 MB/s (100 ÷ 8 = 12.5).",
        },
        {
          q: "Why is my speed test result lower than what I pay my ISP for?",
          a: "Several factors can cause discrepancies: (1) Wi-Fi interference, wall attenuation, or distance from the router; (2) Background downloads, game updates, or streaming devices on your network; (3) Router CPU limitations; or (4) ISP peak-hour network congestion. For the most accurate result, run the test over an Ethernet cable with background apps closed.",
        },
        {
          q: "Why do download and upload speeds differ on home broadband?",
          a: "Most residential broadband plans (such as cable and standard DSL) are asymmetric: ISPs allocate far more bandwidth to downloads (streaming video, browsing) than uploads. Symmetric fiber plans typically provide identical download and upload speeds.",
        },
      ],
    },
    {
      category: "Latency, Jitter & Bufferbloat",
      items: [
        {
          q: "What is Latency (Ping) and what is considered good?",
          a: "Latency is the round-trip time (in milliseconds) required for a data packet to travel from your device to the server and back. Below 20ms is excellent for competitive gaming; 20-50ms is very good for gaming and voice calls; 50-100ms is acceptable for general browsing; and over 150ms can cause noticeable lag.",
        },
        {
          q: "What is Jitter and why does it matter?",
          a: "Jitter measures the variation or instability between consecutive latency measurements. If your ping jumps between 15ms, 45ms, and 12ms, your connection has high jitter. High jitter causes audio stuttering in Zoom/Teams calls and rubber-banding in multiplayer games.",
        },
        {
          q: "What is Bufferbloat and what does the grade mean?",
          a: "Bufferbloat occurs when routers queue too many packets in excessive internal buffers during heavy traffic instead of dropping them, resulting in massive latency spikes. An A+ or A grade means your ping stays low even while downloading at max speed. Grades C, D, or F mean gaming or calls will lag whenever someone else uses your internet.",
        },
      ],
    },
    {
      category: "Privacy & Architecture",
      items: [
        {
          q: "Do you store any of my test data or personal info?",
          a: "No. SpeedPulse operates under a strict Zero-Retention policy. We do not require an account, we do not store IP logs in a database, and the synthetic data sent during upload tests is held only in RAM and discarded immediately.",
        },
        {
          q: "How does SpeedPulse pick which server to test against?",
          a: "Before starting your test, SpeedPulse pings available test nodes simultaneously and measures their round-trip latency. The engine automatically selects the node with the lowest latency to give you the most accurate measurement of your local ISP loop.",
        },
        {
          q: "Can I use SpeedPulse on my mobile phone or tablet?",
          a: "Yes. SpeedPulse is fully responsive and optimized for modern mobile browsers (iOS Safari, Chrome, Firefox, Edge) using native browser Web APIs without needing any app download.",
        },
      ],
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16">
      {/* Hero Header */}
      <PageHeader
        icon={HelpCircle}
        badge="Knowledge Base"
        title="Frequently Asked Questions"
        description="Everything you need to know about understanding your internet speed test results, troubleshooting connection lag, and how SpeedPulse operates."
      />

      {/* FAQ Categories */}
      <section className="space-y-12">
        {faqs.map((cat) => (
          <div key={cat.category} className="space-y-4">
            <h2 className="text-xl font-bold text-cyan-400 tracking-wide uppercase text-xs">
              {cat.category}
            </h2>

            <div className="space-y-4">
              {cat.items.map((item, idx) => (
                <div
                  key={idx}
                  className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-start justify-between gap-4">
                    <span>{item.q}</span>
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed pt-1">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Help CTA */}
      <section className="glass-panel p-8 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div>
          <h3 className="text-lg font-bold text-white">Still have questions?</h3>
          <p className="text-sm text-slate-400 mt-1">
            Need help or want to suggest a feature? Visit our contact page.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-colors"
        >
          <span>Contact Us</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
