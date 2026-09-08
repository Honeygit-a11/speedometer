import React from "react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  badge: string;
  title: string;
  description?: string;
  /** Left-aligned compact header (legal pages) vs centered marketing hero. */
  center?: boolean;
  tone?: "cyan" | "blue" | "emerald";
}

const TONE_CLASSES: Record<NonNullable<PageHeaderProps["tone"]>, string> = {
  cyan: "bg-cyan-950/60 border-cyan-800/60 text-cyan-400",
  blue: "bg-blue-950/60 border-blue-800/60 text-blue-400",
  emerald: "bg-emerald-950/60 border-emerald-800/60 text-emerald-400",
};

/**
 * Shared page hero (badge pill + title + optional description). All marketing
 * and legal pages use the same header structure, varying only icon, tone, and
 * alignment — this keeps one source of truth for the markup.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  badge,
  title,
  description,
  center = true,
  tone = "cyan",
}) => (
  <section className={center ? "text-center space-y-4 max-w-3xl mx-auto" : "space-y-4"}>
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${TONE_CLASSES[tone]}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{badge}</span>
    </div>
    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">{title}</h1>
    {description && (
      <p
        className={
          center ? "text-base sm:text-lg text-slate-400 leading-relaxed" : "text-sm text-slate-400"
        }
      >
        {description}
      </p>
    )}
  </section>
);
