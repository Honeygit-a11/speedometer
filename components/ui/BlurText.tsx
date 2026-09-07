"use client";

import { useEffect, useRef, useState } from "react";

export interface BlurTextProps {
  /** Text to split and reveal. */
  text?: string;
  /** Seconds between each element's reveal. */
  delay?: number;
  /** Split granularity: per word or per letter. */
  animateBy?: "words" | "letters";
  /** Direction the element slides from while blurring in. */
  direction?: "top" | "bottom";
  /** IntersectionObserver visibility fraction that triggers the reveal. */
  threshold?: number;
  /** Root margin for the IntersectionObserver. */
  rootMargin?: string;
  /** Custom starting style (overrides direction default). */
  animationFrom?: { opacity: number; transform: string; filter: string };
  /** Custom ending style. */
  animationTo?: { opacity: number; transform: string; filter: string };
  /**
   * Comma-separated timing functions applied to opacity, transform, filter.
   * A single value is applied to all three.
   */
  easing?: string;
  /** Fires once every element has finished revealing. */
  onAnimationComplete?: () => void;
  className?: string;
}

/**
 * React Bits — BlurText. Each word/letter blurs and translates into focus when
 * the element scrolls into view, staggered by `delay`. CSS-transition based
 * (matches the library's approach), so it needs no animation runtime.
 */
export default function BlurText({
  text = "",
  delay = 0.04,
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  animationFrom,
  animationTo,
  easing = "cubic-bezier(0.215, 0.61, 0.355, 1)",
  onAnimationComplete,
  className = "",
}: BlurTextProps) {
  const segments = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const from =
    animationFrom ??
    (direction === "top"
      ? { opacity: 0, transform: "translate3d(0,-50px,0)", filter: "blur(10px)" }
      : { opacity: 0, transform: "translate3d(0,50px,0)", filter: "blur(10px)" });
  const to = animationTo ?? { opacity: 1, transform: "translate3d(0,0,0)", filter: "blur(0px)" };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (!inView) return;
    const longestDelay = (segments.length - 1) * delay;
    const timer = setTimeout(() => onAnimationComplete?.(), longestDelay * 1000 + 1000);
    return () => clearTimeout(timer);
  }, [inView, delay, segments.length, onAnimationComplete]);

  return (
    <span
      ref={containerRef}
      className={className}
      style={{ display: "inline-flex", flexWrap: "wrap" }}
    >
      {segments.map((segment, index) => (
        <span
          key={index}
          style={{
            display: "inline-block",
            willChange: "transform, filter, opacity",
            opacity: inView ? to.opacity : from.opacity,
            transform: inView ? to.transform : from.transform,
            filter: inView ? to.filter : from.filter,
            transitionProperty: "opacity, transform, filter",
            transitionTimingFunction: easing,
            transitionDuration: `${(delay + 0.6).toFixed(2)}s`,
            transitionDelay: `${inView ? index * delay : 0}s`,
          }}
        >
          {segment}
          {animateBy === "words" && index < segments.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}