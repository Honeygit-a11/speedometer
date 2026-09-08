import type { ClientIdentity } from "@/features/speed-test/engine/client-identity";

export type TestPhase =
  | "IDLE"
  | "INITIALIZING"
  | "DISCOVERING_SERVERS"
  | "PROBING_SERVERS"
  | "SELECTING_SERVER"
  | "PING_TEST"
  | "DOWNLOAD_TEST"
  | "UPLOAD_TEST"
  | "PROCESS_RESULTS"
  | "COMPLETED"
  | "ERROR"
  | "SERVER_UNREACHABLE"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "CANCELLED";

export interface PingMetrics {
  currentPing: number;
  minPing: number;
  avgPing: number;
  /** Median ping (robust to outliers). */
  medianPing: number;
  samples: number[];
}

export interface JitterMetrics {
  jitter: number;
}

/**
 * A single raw throughput sample captured during measurement.
 * Part of the RAW measurement layer — never smoothed or animated.
 */
export interface RawMeasurementSample {
  timestampMs: number;
  cumulativeBytes: number;
  throughputMbps: number;
  streamCount: number;
}

/**
 * Raw transfer metrics (Phase 9 — separated from UI display values).
 * The final result must be derived from these ground-truth values, never from
 * the smoothed `currentMbps` shown in the UI.
 */
export interface RawTransferMetrics {
  samples: RawMeasurementSample[];
  totalBytes: number;
  /** Absolute ms timestamp when measurement (post-warmup) started. */
  measurementStartMs: number;
  /** Absolute ms timestamp when measurement ended. */
  measurementEndMs: number;
  /** True post-warmup measurement duration in ms. */
  measurementDurationMs: number;
  streamCount: number;
}

export interface SpeedMetrics {
  /** Smoothed live value for the UI gauge — NOT used in final calculations. */
  currentMbps: number;
  bytesTransferred: number;
  elapsedMs: number;
  /** Live bytes/elapsed average — display only, never a final result. */
  averageMbps?: number;
  /** Final ground-truth result (post-warmup bytes / post-warmup duration). */
  finalMbps: number;
  loadedLatencyMs?: number;
  /** Real post-warmup throughput samples (for honest stability scoring). */
  samples?: number[];
  /** Number of parallel streams used during measurement. */
  streamCount?: number;
  /** Raw measurement layer — the authoritative source for the final result. */
  raw?: RawTransferMetrics;
}

export interface LoadedLatency {
  idleMs: number;
  /** undefined when no real upload loaded-latency probe was captured. */
  downloadLoadedMs?: number;
  /** undefined when no real download loaded-latency probe was captured. */
  uploadLoadedMs?: number;
  downloadDeltaMs: number;
  uploadDeltaMs: number;
  bufferbloatGrade: "A+" | "A" | "B" | "C" | "D" | "F";
}

export interface NetworkStability {
  score: number;             // 0 - 100%
  speedConsistency: number;   // 0 - 100%
  latencyConsistency: number; // 0 - 100%
  rating: "Excellent" | "Good" | "Moderate" | "Unstable";
}

export interface TestResults {
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  jitter: number;
  timestamp: number;
  loadedLatency?: LoadedLatency;
  stability?: NetworkStability;
}

export interface SpeedTestState {
  phase: TestPhase;
  ping: PingMetrics;
  jitter: JitterMetrics;
  download: SpeedMetrics;
  upload: SpeedMetrics;
  results: TestResults | null;
  error: string | null;
  /** Selected test server info (set after server selection). */
  server?: SelectedServerInfo | null;
  /** Client identity (IP / ISP / region) from the selected server, if any. */
  identity?: ClientIdentity | null;
}

/** Information about the server selected for the current test. */
export interface SelectedServerInfo {
  id: string;
  name: string;
  region: string;
  baseUrl: string;
  latencyMs: number;
}

/**
 * Adaptive test duration configuration (Phase 10).
 * The test runs at least `minDurationMs`, ends early once throughput has been
 * stable for `stableDurationMs`, and never exceeds `maxDurationMs`.
 */
export interface AdaptiveDurationConfig {
  minDurationMs: number;
  maxDurationMs: number;
  /** CV threshold (0-1) below which throughput is considered stable. */
  stabilityThreshold: number;
  /** How long throughput must remain stable before early termination. */
  stableDurationMs: number;
  /** Minimum number of throughput samples required to consider ending early. */
  minSampleCount: number;
}

/** UI display values (Phase 9) — derived, smoothed, never used for results. */
export interface UIDisplayState {
  currentMbps: number;
  progress: number;
  phase: TestPhase;
}
