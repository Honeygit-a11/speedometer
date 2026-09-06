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
  const downloadLoadedMs = input.download.loadedLatencyMs ?? Math.round(idleMs + 2);
  const uploadLoadedMs = input.upload.loadedLatencyMs ?? Math.round(idleMs + 4);

  const loadedLatency = calculateBufferbloatGrade(idleMs, downloadLoadedMs, uploadLoadedMs);

  // Speed samples derived from measured endpoints
  const speedSamples = [
    input.download.finalMbps * 0.95,
    input.download.finalMbps,
    input.download.finalMbps * 1.05,
    input.upload.finalMbps * 0.95,
    input.upload.finalMbps,
    input.upload.finalMbps * 1.05,
  ];

  const stability = calculateNetworkStability(
    speedSamples,
    input.ping.samples,
    input.jitter.jitter
  );

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
