import { calculateJitter, calculateMedian } from "./calculations";

export interface JitterAnalysis {
  jitterMs: number;
  minPingMs: number;
  maxPingMs: number;
  avgPingMs: number;
  medianPingMs: number;
  sampleCount: number;
}

/**
 * Analyzes latency variations to compute jitter and latency distribution.
 *
 * Jitter uses RFC 3550 (mean absolute deviation of consecutive latency deltas) —
 * the standard, documented statistical method for network jitter. Because a
 * single abnormal spike would otherwise dominate the reported central latency,
 * ping is reported as the MEDIAN of samples (robust to outliers), not the mean.
 */
export function analyzeJitter(samples: number[]): JitterAnalysis {
  if (samples.length === 0) {
    return {
      jitterMs: 0,
      minPingMs: 0,
      maxPingMs: 0,
      avgPingMs: 0,
      medianPingMs: 0,
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
      medianPingMs: 0,
      sampleCount: 0,
    };
  }

  const minPing = Math.min(...validSamples);
  const maxPing = Math.max(...validSamples);
  const avgPing = validSamples.reduce((a, b) => a + b, 0) / validSamples.length;
  const medianPing = calculateMedian(validSamples);
  const jitter = calculateJitter(validSamples);

  return {
    jitterMs: jitter,
    minPingMs: Number(minPing.toFixed(1)),
    maxPingMs: Number(maxPing.toFixed(1)),
    avgPingMs: Number(avgPing.toFixed(1)),
    medianPingMs: Number(medianPing.toFixed(1)),
    sampleCount: validSamples.length,
  };
}
