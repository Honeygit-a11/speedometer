import type { Metadata } from "next";
import { ShieldCheck, Lock, EyeOff, Server, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — SpeedPulse Zero-Retention Commitment",
  description:
    "SpeedPulse is built with privacy by design: zero tracking cookies, zero account creation, zero database logs, and immediate disposal of speed-test data in memory.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
      {/* Header */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero-Retention Privacy</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-400">
          Last Updated: March 2026 · Effective Immediately
        </p>
      </section>

      {/* Summary Highlights */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
          <EyeOff className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-sm">No Accounts</h3>
          <p className="text-xs text-slate-400">No passwords, profiles, or registration ever required.</p>
        </div>
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white text-sm">No Tracking Cookies</h3>
          <p className="text-xs text-slate-400">We do not use tracking pixels, ad cookies, or cross-site telemetry.</p>
        </div>
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
          <Server className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-white text-sm">Ephemeral In-Flight Data</h3>
          <p className="text-xs text-slate-400">Test data is consumed in volatile RAM and immediately discarded.</p>
        </div>
      </section>

      {/* Policy Body */}
      <article className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            1. Overview & Core Philosophy
          </h2>
          <p>
            SpeedPulse (&quot;we&quot;, &quot;our&quot;, or &quot;the Service&quot;) was designed with a fundamental
            principle: <strong>You should not have to trade your privacy to measure your internet connection</strong>.
            Unlike conventional speed tests operated by advertising networks, we do not monetize user tracking,
            maintain user behavioral profiles, or sell diagnostic telemetry.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            2. How Test Traffic is Handled
          </h2>
          <p>
            During a speed test, your browser sends and receives synthetic binary streams:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-slate-400 text-sm">
            <li>
              <strong>Download Test:</strong> The server streams uncompressible, random pseudo-binary
              data generated on-the-fly. This data contains no information and is discarded by your
              browser as soon as the bytes are counted.
            </li>
            <li>
              <strong>Upload Test:</strong> Your browser creates random binary buffers in memory and
              POSTs them to our upload endpoint sink. The server counts the bytes received and immediately
              drops the buffer from RAM. <strong>No uploaded data is ever written to disk or any database.</strong>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            3. IP Address and Geolocation
          </h2>
          <p>
            To select the lowest-latency edge server and show your approximate ISP location, the
            server reads standard TCP IP packet headers. This IP address is used solely in volatile memory
            during the active test session to route network packets and calculate rate limits to prevent
            denial-of-service attacks. <strong>We do not maintain persistent logs connecting IP addresses to test histories.</strong>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            4. Cookies & Local Storage
          </h2>
          <p>
            SpeedPulse does not set any advertising, tracking, or marketing cookies. We may use your
            browser&apos;s transient `sessionStorage` strictly to preserve your latest test results on screen
            if you navigate between tabs. This data remains on your device and is never transmitted to us.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            5. GDPR & CCPA Compliance
          </h2>
          <p>
            Because SpeedPulse adheres to data minimization and does not collect, store, or process
            personally identifiable information (PII), we fully comply with the European Union General
            Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA) by default.
            There is no user data stored on our servers to request, export, or delete.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            6. Changes to this Policy
          </h2>
          <p>
            Any minor updates to this Privacy Policy will be posted on this page with an updated
            effective date. Our foundational commitment to zero-log testing and zero user tracking
            remains permanent.
          </p>
        </section>
      </article>
    </div>
  );
}
