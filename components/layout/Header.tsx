"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, ShieldCheck, Menu, X, BookOpen } from "lucide-react";

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Test" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/guides", label: "Guides" },
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              SpeedPulse
            </span>
            <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold ml-2 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
              Edge
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-white transition-colors py-1"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Badges */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-edge-pulse" />
            <span className="text-slate-300">Edge Node</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">Zero-Log</span>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900/60 transition-colors"
              >
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-around text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Cloudflare Edge</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Storage</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
