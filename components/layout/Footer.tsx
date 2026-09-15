import React from "react";
import Link from "next/link";
import { Cpu, Globe2, Lock, Zap, BookOpen } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 mt-auto pt-14 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Top Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 sm:col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1px]">
                <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-bold text-base tracking-tight text-white">SpeedPulse</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Independent, high-precision internet bandwidth and connection quality diagnostics
              powered by distributed edge nodes. Designed for honest, zero-ad network evaluation.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>Edge Measurement Nodes Active</span>
            </div>
          </div>

          {/* Navigation Links Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Speed Test
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  FAQ & Glossary
                </Link>
              </li>
            </ul>
          </div>

          {/* Guides & Resources Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Guides</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/guides" className="hover:text-white transition-colors">
                  All Guides Hub
                </Link>
              </li>
              <li>
                <Link href="/guides/troubleshoot-slow-wifi" className="hover:text-white transition-colors">
                  Fix Slow Wi-Fi
                </Link>
              </li>
              <li>
                <Link href="/guides/understanding-bufferbloat" className="hover:text-white transition-colors">
                  Bufferbloat Guide
                </Link>
              </li>
              <li>
                <Link href="/guides/what-is-good-internet-speed" className="hover:text-white transition-colors">
                  Good Speed Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Privacy Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Legal & Transparency</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-white transition-colors">
                  Speed Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact & Inquiries
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Security / Architecture Badges Row */}
        <div className="pt-6 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Zero Account & Zero Database Retention</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Multi-Region Edge Node Routing</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>RFC 3550 Standardized Jitter Metric</span>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            SpeedPulse &copy; {new Date().getFullYear()} · All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/disclaimer" className="hover:text-slate-400 transition-colors">
              Informational Utility Only
            </Link>
            <span>·</span>
            <Link href="/privacy-policy" className="hover:text-slate-400 transition-colors">
              No User Profiling
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
