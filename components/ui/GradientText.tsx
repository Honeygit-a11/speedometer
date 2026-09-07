import type { CSSProperties, ReactNode } from "react";

export interface GradientTextProps {
  children: ReactNode;
  /** Space-separated class list for the container. */
  className?: string;
  /** Gradient stops, in order. */
  colors?: string[];
  /** Seconds for one full gradient cycle. */
  animationSpeed?: number;
  /** When true, renders a faint rounded border around the text. */
  showBorder?: boolean;
}

/**
 * React Bits — GradientText. Animated multi-stop gradient fill on the text
 * (background-position drifts continuously). Pure presentation.
 */
export default function GradientText({
  children,
  className = "",
  colors = ["#22d3ee", "#5eead4", "#34d399", "#22d3ee"],
  animationSpeed = 6,
  showBorder = false,
}: GradientTextProps) {
  const style: CSSProperties = {
    backgroundImage: `linear-gradient(135deg, ${colors.join(", ")})`,
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <span
      className={`rb-gradient-text ${showBorder ? "border border-slate-700/60 rounded-lg p-1" : ""} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}