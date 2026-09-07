import { PingMetrics, JitterMetrics, SpeedMetrics, TestResults } from "@/types";
import { calculateBufferbloatGrade, calculateNetworkStability } from "./stability";

export interface AggregateInput {
  ping: PingMetrics;
  jitter: JitterMetrics;
  download: SpeedMetrics;
  upload: SpeedMetrics;
}

/**
 * Aggregates all sub-test results into a final immutable TestResults payload,
 * including advanced network metrics (Loaded Latency, Bufferbloat Grade, Stability).
 */
export function aggregateResults(input: AggregateInput): TestResults {
  const idleMs = input.ping.avgPing > 0 ? input.ping.avgPing : input.ping.currentPing;

  // Loaded latency is only reported from real concurrent probes; never fabricated.
  const downloadLoadedMs = input.download.loadedLatencyMs;
  const uploadLoadedMs = input.upload.loadedLatencyMs;
  const hasLoadedLatencyProbe = downloadLoadedMs !== undefined || uploadLoadedMs !== undefined;
  const loadedLatency = hasLoadedLatencyProbe
    ? calculateBufferbloatGrade(idleMs, downloadLoadedMs ?? idleMs, uploadLoadedMs ?? idleMs)
    : undefined;

  // Stability is scored from REAL post-warmup throughput samples within a single
  // direction. Download and upload run at different magnitudes, so mixing them
  // would inflate the coefficient of variation. Omitted when data is insufficient.
  const downloadSamples = input.download.samples ?? [];
  const uploadSamples = input.upload.samples ?? [];
  const speedSamples =
    downloadSamples.length >= 3 ? downloadSamples : uploadSamples.length >= 3 ? uploadSamples : [];
  const stability =
    speedSamples.length >= 3 && input.ping.samples.length > 0
      ? calculateNetworkStability(speedSamples, input.ping.samples, input.jitter.jitter)
      : undefined;

  return {
    downloadSpeed: Number(input.download.finalMbps.toFixed(1)),
    uploadSpeed: Number(input.upload.finalMbps.toFixed(1)),
    ping: Math.round(idleMs),
    jitter: Number(input.jitter.jitter.toFixed(1)),
    timestamp: Date.now(),
    loadedLatency,
    stability,
  };
}
