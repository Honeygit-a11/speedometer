import React from "react";
import Link from "next/link";
import { Cpu, Globe2, Lock, Zap } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 mt-auto pt-12 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1px]">
                <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-bold text-base tracking-tight text-white">SpeedPulse</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ad-free, high-precision internet speed and connection quality measurement powered by
              global edge nodes.
            </p>
          </div>

          {/* Navigation Links Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs text-slate-400">
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

          {/* Legal & Privacy Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture Badges Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Security</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero Account & Zero Database</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Distributed Edge Routing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>RFC 3550 Jitter Standard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            SpeedPulse &copy; {new Date().getFullYear()} · All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Independent Edge Diagnostics</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
