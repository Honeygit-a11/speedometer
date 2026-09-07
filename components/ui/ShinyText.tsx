import type { CSSProperties } from "react";

export interface ShinyTextProps {
  text: string;
  /** Disable the sheen sweep (keeps the base text). */
  disabled?: boolean;
  /** Seconds per sheen sweep. */
  speed?: number;
  /** Extra classes for the wrapper span. */
  className?: string;
}

/**
 * React Bits — ShinyText. A bright sheen periodically sweeps across the text
 * via a gradient mask. Pure presentation.
 */
export default function ShinyText({
  text,
  disabled = false,
  speed = 5,
  className = "",
}: ShinyTextProps) {
  return (
    <span
      data-text={text}
      className={`rb-shiny-text ${disabled ? "rb-shiny-disabled" : ""} ${className}`}
      style={{ "--shiny-speed": `${speed}s` } as CSSProperties}
    >
      {text}
    </span>
  );
}