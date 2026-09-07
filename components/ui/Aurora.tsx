import type { CSSProperties } from "react";

export interface AuroraProps {
  /** Extra classes for the wrapper layer. */
  className?: string;
  /** Duration (s) of the gradient drift. */
  speed?: number;
}

/**
 * React Bits — Aurora. Fullscreen animated gradient mesh that drifts slowly,
 * matching the app's cyan/blue/emerald palette. Pure presentation (no hooks),
 * so it renders safely on the server behind the page content.
 */
export default function Aurora({ className = "", speed = 14 }: AuroraProps) {
  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`}>
      <div
        className="rb-aurora-layer"
        style={{ "--aurora-speed": `${speed}s` } as CSSProperties}
      />
      <div
        className="rb-aurora-layer"
        style={
          {
            "--aurora-angle": "135deg",
            "--aurora-speed": `${(speed * 1.5).toFixed(1)}s`,
            animationDelay: "-6s",
          } as CSSProperties
        }
      />
    </div>
  );
}