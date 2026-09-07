"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { Wifi, Zap, Globe2, ShieldCheck } from "lucide-react";
import { BlurText, GradientText } from "./ui";

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const features = [
  {
    icon: Zap,
    color: "cyan",
    title: "Browser-Timed",
    description: "Measurements happen directly in your browser without proxying through heavy app servers.",
    glow: "shadow-cyan-500/10",
    border: "hover:border-cyan-500/40",
    iconBg: "bg-cyan-950/60 border-cyan-800/40 text-cyan-400",
  },
  {
    icon: Globe2,
    color: "emerald",
    title: "Cloudflare Edge",
    description: "Streams data dynamically through isolated serverless workers on Cloudflare's global network.",
    glow: "shadow-emerald-500/10",
    border: "hover:border-emerald-500/40",
    iconBg: "bg-emerald-950/60 border-emerald-800/40 text-emerald-400",
  },
  {
    icon: ShieldCheck,
    color: "purple",
    title: "100% Zero-Storage",
    description: "Upload payloads are consumed in memory and immediately discarded. No databases or tracking.",
    glow: "shadow-purple-500/10",
    border: "hover:border-purple-500/40",
    iconBg: "bg-purple-950/60 border-purple-800/40 text-purple-400",
  },
];

export const LandingContent: React.FC = () => {
  return (
    <motion.div
      className="w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-10"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Title & Subheading */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 text-xs font-semibold shadow-inner">
          <Wifi className="w-3.5 h-3.5" />
          <span>Independent Edge Network Measurement</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
          Test Your{" "}
          <GradientText>Internet Speed</GradientText>
        </h1>
        <BlurText
          text="Real-time, accurate measurements for Download, Upload, Ping, and Jitter directly from your browser to Cloudflare edge nodes."
          animateBy="words"
          delay={0.05}
          className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto"
        />
      </motion.div>

      {/* Architectural Highlights */}
      <motion.div
        variants={fadeUp}
        className="w-full max-w-3xl pt-8 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left"
      >
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`space-y-2 p-4 rounded-2xl glass-panel border border-slate-800/80 hover:border-slate-700/80 ${f.border} ${f.glow} transition-colors duration-300`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${f.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${f.color === "cyan" ? "text-cyan-400" : f.color === "emerald" ? "text-emerald-400" : "text-purple-400"}`}>
                  {f.title}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};
