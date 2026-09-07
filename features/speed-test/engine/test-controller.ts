import { SpeedTestState, TestPhase, TestResults } from "@/types";
import { runPingTest } from "./ping";
import { runDownloadTest } from "./download";
import { runUploadTest } from "./upload";
import { aggregateResults } from "./results";
import { checkBrowserCompatibility } from "./compatibility";

export interface SpeedTestConfig {
  workerUrl: string;
  pingProbes?: number;
  downloadDurationMs?: number;
  uploadDurationMs?: number;
  warmupMs?: number;
}

export type StateChangeListener = (state: SpeedTestState) => void;

const INITIAL_STATE: SpeedTestState = {
  phase: "IDLE",
  ping: { currentPing: 0, minPing: 0, avgPing: 0, samples: [] },
  jitter: { jitter: 0 },
  download: { currentMbps: 0, bytesTransferred: 0, elapsedMs: 0, finalMbps: 0 },
  upload: { currentMbps: 0, bytesTransferred: 0, elapsedMs: 0, finalMbps: 0 },
  results: null,
  error: null,
};

/**
 * Headless Speed Test Controller
 * Coordinates the full measurement lifecycle through an event-driven state machine.
 */
export class SpeedTestController {
  private state: SpeedTestState = { ...INITIAL_STATE };
  private listeners: Set<StateChangeListener> = new Set();
  private abortController: AbortController | null = null;
  private isRunning = false;

  constructor() {
    this.reset();
  }

  public getState(): SpeedTestState {
    return { ...this.state };
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<SpeedTestState>) {
    this.state = {
      ...this.state,
      ...partial,
    };
    this.notify();
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error("[SpeedTest Engine] Listener notification error:", err);
      }
    });
  }

  public reset() {
    if (this.isRunning) {
      this.cancel();
    }
    this.state = {
      phase: "IDLE",
      ping: { currentPing: 0, minPing: 0, avgPing: 0, samples: [] },
      jitter: { jitter: 0 },
      download: { currentMbps: 0, bytesTransferred: 0, elapsedMs: 0, finalMbps: 0 },
      upload: { currentMbps: 0, bytesTransferred: 0, elapsedMs: 0, finalMbps: 0 },
      results: null,
      error: null,
    };
    this.notify();
  }

  public cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isRunning = false;
    this.updateState({ phase: "CANCELLED" });
  }

  /**
   * Executes the full speed test sequence:
   * INITIALIZING -> PING_TEST -> DOWNLOAD_TEST -> UPLOAD_TEST -> PROCESS_RESULTS -> COMPLETED
   */
  public async start(config: SpeedTestConfig): Promise<TestResults> {
    if (this.isRunning) {
      throw new Error("A speed test is already actively running");
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      // 0. BROWSER COMPATIBILITY CHECK
      const compat = checkBrowserCompatibility();
      if (!compat.supported) {
        throw new Error(
          `Your browser lacks required speed testing APIs: ${compat.missingFeatures.join(", ")}`
        );
      }

      // 1. INITIALIZING
      this.updateState({
        phase: "INITIALIZING",
        error: null,
        results: null,
      });

      // Quick reachability verification
      const reachability = await fetch(`${config.workerUrl.replace(/\/$/, "")}/health`, {
        cache: "no-store",
        signal,
      }).catch((err) => {
        throw new Error(`Testing endpoint unreachable: ${err.message}`);
      });

      if (!reachability.ok) {
        throw new Error(`Testing endpoint returned status ${reachability.status}`);
      }

      // 2. PING TEST
      this.updateState({ phase: "PING_TEST" });
      const pingResult = await runPingTest({
        workerUrl: config.workerUrl,
        sampleCount: config.pingProbes ?? 6,
        signal,
        onProbe: (currentPing, stats) => {
          this.updateState({
            ping: {
              ...this.state.ping,
              currentPing,
              minPing: stats.min,
              avgPing: stats.avg,
            },
            jitter: {
              jitter: stats.jitter,
            },
          });
        },
      });

      this.updateState({
        ping: pingResult.ping,
        jitter: pingResult.jitter,
      });

      // 3. DOWNLOAD TEST
      this.updateState({ phase: "DOWNLOAD_TEST" });
      const downloadResult = await runDownloadTest({
        workerUrl: config.workerUrl,
        durationMs: config.downloadDurationMs ?? 8000,
        warmupMs: config.warmupMs ?? 1500,
        signal,
        onProgress: (metrics) => {
          this.updateState({
            download: {
              currentMbps: metrics.currentMbps,
              bytesTransferred: metrics.bytesTransferred,
              elapsedMs: metrics.elapsedMs,
              finalMbps: 0, // populated with the true result once the phase completes
            },
          });
        },
      });

      this.updateState({
        download: downloadResult,
      });

      // 4. UPLOAD TEST
      this.updateState({ phase: "UPLOAD_TEST" });
      const uploadResult = await runUploadTest({
        workerUrl: config.workerUrl,
        durationMs: config.uploadDurationMs ?? 8000,
        warmupMs: config.warmupMs ?? 1500,
        signal,
        onProgress: (metrics) => {
          this.updateState({
            upload: {
              currentMbps: metrics.currentMbps,
              bytesTransferred: metrics.bytesTransferred,
              elapsedMs: metrics.elapsedMs,
              finalMbps: 0, // populated with the true result once the phase completes
            },
          });
        },
      });

      this.updateState({
        upload: uploadResult,
      });

      // 5. PROCESS RESULTS
      this.updateState({ phase: "PROCESS_RESULTS" });
      const finalResults = aggregateResults({
        ping: this.state.ping,
        jitter: this.state.jitter,
        download: this.state.download,
        upload: this.state.upload,
      });

      // 6. COMPLETED
      this.updateState({
        phase: "COMPLETED",
        results: finalResults,
      });

      this.isRunning = false;
      this.abortController = null;
      return finalResults;
    } catch (err: unknown) {
      this.isRunning = false;
      this.abortController = null;

      if ((err as Error)?.name === "AbortError" || this.state.phase === "CANCELLED") {
        this.updateState({ phase: "CANCELLED" });
        throw err;
      }

      const errorMessage = (err as Error)?.message || "Speed test failed";
      this.updateState({
        phase: "ERROR",
        error: errorMessage,
      });
      throw err;
    }
  }
}

// Export singleton instance for convenience
export const speedTestController = new SpeedTestController();
