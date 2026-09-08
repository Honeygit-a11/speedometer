import type { Metadata } from "next";
import { FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Terms and Conditions — SpeedPulse",
  description:
    "Terms of service and acceptable use guidelines for the SpeedPulse internet speed testing platform.",
};

export default function TermsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
      {/* Header */}
      <PageHeader
        icon={FileText}
        center={false}
        badge="Legal Agreement"
        title="Terms & Conditions"
        description="Last Updated: March 2026 · Please read these terms carefully before using SpeedPulse."
      />

      {/* Notice Card */}
      <section className="glass-panel p-6 rounded-2xl border border-yellow-800/40 bg-yellow-950/10 flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-1" />
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          SpeedPulse is a free, web-based diagnostic utility. By initiating a speed test, you
          acknowledge that measurement traffic intentionally consumes high network bandwidth
          for the duration of the test.
        </p>
      </section>

      {/* Terms Body */}
      <article className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using the SpeedPulse website and associated measurement endpoints
            (&quot;the Service&quot;), you agree to be bound by these Terms and Conditions. If you do not agree
            to these terms, please do not use the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            2. Permitted & Acceptable Use
          </h2>
          <p>
            SpeedPulse is provided for personal and non-commercial network diagnostic evaluation. You agree:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-slate-400 text-sm">
            <li>Not to launch automated denial-of-service (DDoS) loops against our test nodes.</li>
            <li>Not to abuse the download or upload endpoints for free proxying or file hosting.</li>
            <li>Not to reverse-engineer or attempt to circumvent our rate limiting or abuse controls.</li>
            <li>To comply with your local Internet Service Provider&apos;s data plan policies and caps.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            3. Accuracy & Nature of Network Measurements
          </h2>
          <p>
            Network throughput, latency, and jitter are subject to numerous dynamic variables beyond
            our control, including Wi-Fi interference, home network device contention, ISP routing,
            and intermediate transit peering congestion.
          </p>
          <p className="text-slate-400 text-sm">
            While SpeedPulse employs scientific algorithms (RFC 3550 jitter, post-warmup sampling) to
            maximize precision, results are provided &quot;as is&quot; for diagnostic and informational purposes,
            and do not constitute an official legal or contractual audit of your ISP agreement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            4. Bandwidth Consumption Notice
          </h2>
          <p>
            Depending on your connection speed, running a full speed test may consume between 50 MB
            and 800 MB of data. If you are connected via mobile cellular data or a metered broadband
            connection, applicable carrier data usage fees remain your sole responsibility.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            5. Disclaimer of Warranties & Limitation of Liability
          </h2>
          <p>
            The Service is provided on an &quot;as available&quot; basis without warranties of any kind, whether
            express or implied. Under no circumstances shall SpeedPulse or its operators be held liable
            for any direct, indirect, incidental, or consequential damages resulting from the use or
            inability to use the Service.
          </p>
        </section>
      </article>
    </div>
  );
}
