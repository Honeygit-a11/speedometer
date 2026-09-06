import React from "react";
import { Cpu, Globe2, Lock } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 mt-auto py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-cyan-400" />
          <span>Independent browser-to-edge measurement engine</span>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>No Account & No Database Required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Powered by Next.js & Cloudflare Workers</span>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          SpeedPulse &copy; {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
};
