import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatSpeed(speedMbps: number): string {
  if (speedMbps < 0.01) return "0.00";
  if (speedMbps < 1) return speedMbps.toFixed(2);
  if (speedMbps < 10) return speedMbps.toFixed(2);
  if (speedMbps < 100) return speedMbps.toFixed(1);
  return Math.round(speedMbps).toString();
}

export function formatLatency(latencyMs: number): string {
  if (latencyMs <= 0) return "--";
  return Math.round(latencyMs).toString();
}
