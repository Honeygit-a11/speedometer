import { calculateJitter } from "./calculations";

export interface JitterAnalysis {
  jitterMs: number;
  minPingMs: number;
  maxPingMs: number;
  avgPingMs: number;
  sampleCount: number;
}

/**
 * Analyzes latency variations to compute jitter and latency distribution.
 */
export function analyzeJitter(samples: number[]): JitterAnalysis {
  if (samples.length === 0) {
    return {
      jitterMs: 0,
      minPingMs: 0,
      maxPingMs: 0,
      avgPingMs: 0,
      sampleCount: 0,
    };
  }

  const validSamples = samples.filter((s) => s > 0);
  if (validSamples.length === 0) {
    return {
      jitterMs: 0,
      minPingMs: 0,
      maxPingMs: 0,
      avgPingMs: 0,
      sampleCount: 0,
    };
  }

  const minPing = Math.min(...validSamples);
  const maxPing = Math.max(...validSamples);
  const avgPing = validSamples.reduce((a, b) => a + b, 0) / validSamples.length;
  const jitter = calculateJitter(validSamples);

  return {
    jitterMs: jitter,
    minPingMs: Number(minPing.toFixed(1)),
    maxPingMs: Number(maxPing.toFixed(1)),
    avgPingMs: Number(avgPing.toFixed(1)),
    sampleCount: validSamples.length,
  };
}
