/**
 * Types and interfaces for the LibreSpeed integration layer.
 */

export interface LibreSpeedConfig {
  /** Base URL of the LibreSpeed server (e.g. http://127.0.0.1:8888 or https://xyz.railway.app) */
  serverUrl: string;
  /** Number of ping latency probes to execute */
  pingProbes?: number;
  /** Duration of download measurement in milliseconds */
  downloadDurationMs?: number;
  /** Minimum download duration before stability check */
  downloadMinDurationMs?: number;
  /** Duration of upload measurement in milliseconds */
  uploadDurationMs?: number;
  /** Minimum upload duration before stability check */
  uploadMinDurationMs?: number;
  /** Warmup period in ms to discard initial TCP transients */
  warmupMs?: number;
  /** Concurrency level (number of parallel streams) */
  concurrency?: number;
  /** Maximum chunk size in MB for download */
  downloadChunkSizeMb?: number;
}

export type LibreSpeedPhase =
  | "IDLE"
  | "INITIALIZING"
  | "PING"
  | "DOWNLOAD"
  | "UPLOAD"
  | "COMPLETED"
  | "ERROR"
  | "CANCELLED";

export interface LibreSpeedTelemetry {
  phase: LibreSpeedPhase;
  currentMbps: number;
  bytesTransferred: number;
  progress: number;
  currentPing?: number;
  avgPing?: number;
  jitter?: number;
  streamCount?: number;
}

export interface LibreSpeedResults {
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  jitter: number;
  minPing: number;
  downloadBytes: number;
  uploadBytes: number;
  downloadDurationMs: number;
  uploadDurationMs: number;
  serverUrl: string;
  timestamp: number;
}
