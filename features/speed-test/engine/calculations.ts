/**
 * Mathematical and Statistical Calculation Utilities for Speed Testing
 * Implements standard telecom decimal bandwidth formulas (1 Mbps = 1,000,000 bps)
 * and rolling window aggregation to eliminate chunk quantization noise.
 */

/**
 * Calculates speed in Megabits per second (Mbps).
 * Formula: (Bytes * 8 bits) / (Seconds * 1,000,000 bits)
 */
export function calculateSpeedMbps(bytes: number, durationSeconds: number): number {
  if (durationSeconds <= 0 || bytes <= 0) return 0;
  const bits = bytes * 8;
  const mbps = bits / (durationSeconds * 1_000_000);
  return Math.max(0, Number(mbps.toFixed(2)));
}

/**
 * Calculates standard RFC 3550 network jitter.
 * Jitter measures the mean absolute deviation between consecutive latency measurements.
 * Formula: (1 / (N - 1)) * Sum(|D_i - D_{i-1}|)
 */
export function calculateJitter(samples: number[]): number {
  if (samples.length < 2) return 0;

  let totalDiff = 0;
  for (let i = 1; i < samples.length; i++) {
    totalDiff += Math.abs(samples[i] - samples[i - 1]);
  }

  const jitter = totalDiff / (samples.length - 1);
  return Number(jitter.toFixed(1));
}

/**
 * Calculates a trimmed mean to filter out transient packet bursts or stalls.
 */
export function calculateTrimmedMean(samples: number[], trimPercent = 0.15): number {
  if (samples.length === 0) return 0;
  if (samples.length <= 3) {
    const sum = samples.reduce((a, b) => a + b, 0);
    return Number((sum / samples.length).toFixed(2));
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const trimCount = Math.max(1, Math.floor(sorted.length * trimPercent));
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

  if (trimmed.length === 0) return sorted[Math.floor(sorted.length / 2)];

  const sum = trimmed.reduce((a, b) => a + b, 0);
  return Number((sum / trimmed.length).toFixed(2));
}

/**
 * Calculates the median of a sample set (robust central tendency, tolerant of
 * a single outlier spike — used for ping reporting).
 */
export function calculateMedian(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
  }
  return Number(sorted[mid].toFixed(2));
}

/**
 * Population standard deviation.
 */
export function calculateStdDev(samples: number[]): number {
  if (samples.length === 0) return 0;
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance =
    samples.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / samples.length;
  return Math.sqrt(variance);
}

/**
 * Coefficient of variation (stdDev / mean) — a dimensionless, scale-invariant
 * measure of stability. 0 = perfectly stable.
 */
export function calculateCoefficientOfVariation(samples: number[]): number {
  if (samples.length === 0) return 0;
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  if (mean === 0) return 0;
  return calculateStdDev(samples) / mean;
}

/**
 * Whether a throughput sample set has been stable long enough to end the test
 * early (adaptive duration). Uses the coefficient of variation over the most
 * recent `windowSize` samples.
 */
export function isThroughputStable(
  samples: number[],
  threshold: number,
  windowSize = 8
): boolean {
  if (samples.length < windowSize) return false;
  const recent = samples.slice(-windowSize);
  const cv = calculateCoefficientOfVariation(recent);
  return cv <= threshold;
}

/**
 * Calculates the Nth percentile of a sample set (e.g. 90th percentile).
 */
export function calculatePercentile(samples: number[], percentile = 0.9): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor(sorted.length * percentile))
  );
  return Number(sorted[index].toFixed(2));
}

/**
 * Exponential moving average (EMA) for smooth UI gauge updates.
 */
export function calculateEMA(currentValue: number, previousEMA: number, alpha = 0.3): number {
  if (previousEMA === 0) return currentValue;
  return Number((alpha * currentValue + (1 - alpha) * previousEMA).toFixed(2));
}

/**
 * Rolling Window Throughput Tracker
 * Records (timestamp, cumulativeBytes) snapshots to compute true throughput
 * over a rolling time window (e.g. 1000ms), eliminating micro-burst fluctuations.
 */
export class RollingThroughputTracker {
  private snapshots: Array<{ time: number; bytes: number }> = [];
  private windowDurationMs: number;

  constructor(windowDurationMs = 1000) {
    this.windowDurationMs = windowDurationMs;
  }

  public record(time: number, bytes: number) {
    this.snapshots.push({ time, bytes });
    const cutoff = time - this.windowDurationMs;
    while (this.snapshots.length > 2 && this.snapshots[0].time < cutoff) {
      this.snapshots.shift();
    }
  }

  public getCurrentMbps(): number {
    if (this.snapshots.length < 2) return 0;
    const oldest = this.snapshots[0];
    const newest = this.snapshots[this.snapshots.length - 1];

    const elapsedSec = (newest.time - oldest.time) / 1000;
    const deltaBytes = newest.bytes - oldest.bytes;

    if (elapsedSec <= 0 || deltaBytes <= 0) return 0;
    return calculateSpeedMbps(deltaBytes, elapsedSec);
  }

  public reset() {
    this.snapshots = [];
  }
}
