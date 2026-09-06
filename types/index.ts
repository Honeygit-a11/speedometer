export type TestPhase =
  | "IDLE"
  | "INITIALIZING"
  | "PING_TEST"
  | "DOWNLOAD_TEST"
  | "UPLOAD_TEST"
  | "PROCESS_RESULTS"
  | "COMPLETED"
  | "ERROR"
  | "CANCELLED";

export interface PingMetrics {
  currentPing: number;
  minPing: number;
  avgPing: number;
  samples: number[];
}

export interface JitterMetrics {
  jitter: number;
}

export interface SpeedMetrics {
  currentMbps: number;
  bytesTransferred: number;
  elapsedMs: number;
  finalMbps: number;
  loadedLatencyMs?: number;
}

export interface LoadedLatency {
  idleMs: number;
  downloadLoadedMs: number;
  uploadLoadedMs: number;
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
}
