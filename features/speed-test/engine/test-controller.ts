import { SpeedTestState, TestPhase, TestResults, SelectedServerInfo } from "@/types";
import { runPingTest } from "./ping";
import { runDownloadTest } from "./download";
import { runUploadTest } from "./upload";
import { aggregateResults } from "./results";
import { checkBrowserCompatibility } from "./compatibility";
import { getServerList, SpeedTestServer } from "./server-registry";
import { selectBestServer, ServerSelectionResult } from "./server-selection";
import { libreSpeedClient } from "../integration/librespeed-client";
import { detectServerBackend } from "./server-endpoints";

export interface SpeedTestConfig {
  /** Explicit server list override. Defaults to the configured registry. */
  servers?: SpeedTestServer[];
  /** Latency probes per candidate server during selection (default 4). */
  serverProbeCount?: number;
  pingProbes?: number;
  /** Hard caps on measurement phases (default 8000ms each). */
  downloadMaxDurationMs?: number;
  uploadMaxDurationMs?: number;
  /** Minimum duration before early termination (default 4000ms each). */
  downloadMinDurationMs?: number;
  uploadMinDurationMs?: number;
  warmupMs?: number;
}

export type StateChangeListener = (state: SpeedTestState) => void;

const EMPTY_PING = { currentPing: 0, minPing: 0, avgPing: 0, medianPing: 0, samples: [] };
const EMPTY_SPEED = { currentMbps: 0, bytesTransferred: 0, elapsedMs: 0, finalMbps: 0 };

const INITIAL_STATE: SpeedTestState = {
  phase: "IDLE",
  ping: EMPTY_PING,
  jitter: { jitter: 0 },
  download: EMPTY_SPEED,
  upload: EMPTY_SPEED,
  results: null,
  error: null,
  server: null,
};

/**
 * Headless Speed Test Controller
 * Coordinates the full measurement lifecycle through an event-driven state machine.
 *
 * Flow: IDLE → INITIALIZING → (SERVER SELECTION) → PING_TEST → DOWNLOAD_TEST →
 * UPLOAD_TEST → PROCESS_RESULTS → COMPLETED, plus ERROR / CANCELLED.
 *
 * Failover: the best server is chosen by measured latency; if the whole test
 * fails against it (network-level error), it retries against the next ranked
 * server before giving up.
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
      ping: { ...EMPTY_PING },
      jitter: { jitter: 0 },
      download: { ...EMPTY_SPEED },
      upload: { ...EMPTY_SPEED },
      results: null,
      error: null,
      server: null,
    };
    this.notify();
  }

  public cancel() {
    libreSpeedClient.cancel();
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isRunning = false;
    this.updateState({ phase: "CANCELLED" });
  }

  /**
   * Ground-truth measurement pipeline: post-warmup bytes / duration, server-
   * verified upload counts, and median ping. This is the primary path because
   * it derives results from actual transferred data rather than worker estimates.
   */
  private async runCustomEngine(
    config: SpeedTestConfig,
    server: SpeedTestServer,
    signal: AbortSignal
  ): Promise<TestResults> {
    const url = server.baseUrl;
    const warmupMs = config.warmupMs ?? 1500;

    this.updateState({ phase: "PING_TEST" });
    const pingResult = await runPingTest({
      workerUrl: url,
      server,
      sampleCount: config.pingProbes ?? 10,
      signal,
      onProbe: (currentPing, stats) => {
        this.updateState({
          ping: {
            ...this.state.ping,
            currentPing,
            minPing: stats.min,
            avgPing: stats.avg,
            medianPing: stats.median,
          },
          jitter: { jitter: stats.jitter },
        });
      },
    });

    this.updateState({ ping: pingResult.ping, jitter: pingResult.jitter });

    this.updateState({ phase: "DOWNLOAD_TEST" });
    const downloadResult = await runDownloadTest({
      workerUrl: url,
      server,
      maxDurationMs: config.downloadMaxDurationMs ?? 8000,
      minDurationMs: config.downloadMinDurationMs ?? 4000,
      warmupMs,
      signal,
      onProgress: (metrics) => {
        this.updateState({
          download: {
            ...this.state.download,
            currentMbps: metrics.currentMbps,
            bytesTransferred: metrics.bytesTransferred,
            elapsedMs: metrics.elapsedMs,
            finalMbps: 0,
          },
        });
      },
    });
    this.updateState({ download: downloadResult });

    this.updateState({ phase: "UPLOAD_TEST" });
    const uploadResult = await runUploadTest({
      workerUrl: url,
      server,
      maxDurationMs: config.uploadMaxDurationMs ?? 8000,
      minDurationMs: config.uploadMinDurationMs ?? 4000,
      warmupMs,
      signal,
      onProgress: (metrics) => {
        this.updateState({
          upload: {
            ...this.state.upload,
            currentMbps: metrics.currentMbps,
            bytesTransferred: metrics.bytesTransferred,
            elapsedMs: metrics.elapsedMs,
            finalMbps: 0,
          },
        });
      },
    });
    this.updateState({ upload: uploadResult });

    this.updateState({ phase: "PROCESS_RESULTS" });
    return aggregateResults({
      ping: this.state.ping,
      jitter: this.state.jitter,
      download: this.state.download,
      upload: this.state.upload,
    });
  }

  /**
   * LibreSpeed web-worker fallback for LibreSpeed-compatible backends only.
   */
  private async runLibreSpeedEngine(
    config: SpeedTestConfig,
    server: SpeedTestServer,
    signal: AbortSignal
  ): Promise<TestResults> {
    const url = server.baseUrl;
    const warmupMs = config.warmupMs ?? 1500;

    const libreResult = await libreSpeedClient.runTest(
      {
        serverUrl: url,
        pingProbes: config.pingProbes ?? 10,
        downloadDurationMs: config.downloadMaxDurationMs ?? 8000,
        downloadMinDurationMs: config.downloadMinDurationMs ?? 4000,
        uploadDurationMs: config.uploadMaxDurationMs ?? 8000,
        uploadMinDurationMs: config.uploadMinDurationMs ?? 4000,
        warmupMs,
        downloadChunkSizeMb: 4,
        concurrency: 4,
      },
      (telemetry) => {
        if (signal.aborted) return;

        if (telemetry.phase === "PING") {
          this.updateState({
            phase: "PING_TEST",
            ping: {
              ...this.state.ping,
              currentPing: telemetry.currentPing ?? this.state.ping.currentPing,
              minPing: telemetry.currentPing
                ? Math.min(this.state.ping.minPing || Infinity, telemetry.currentPing)
                : this.state.ping.minPing,
              avgPing: telemetry.avgPing ?? this.state.ping.avgPing,
              medianPing: telemetry.avgPing ?? this.state.ping.medianPing,
            },
            jitter: { jitter: telemetry.jitter ?? this.state.jitter.jitter },
          });
        } else if (telemetry.phase === "DOWNLOAD") {
          this.updateState({
            phase: "DOWNLOAD_TEST",
            download: {
              ...this.state.download,
              currentMbps: telemetry.currentMbps,
              bytesTransferred: telemetry.bytesTransferred,
              elapsedMs: 0,
              finalMbps: 0,
            },
          });
        } else if (telemetry.phase === "UPLOAD") {
          this.updateState({
            phase: "UPLOAD_TEST",
            upload: {
              ...this.state.upload,
              currentMbps: telemetry.currentMbps,
              bytesTransferred: telemetry.bytesTransferred,
              elapsedMs: 0,
              finalMbps: 0,
            },
          });
        }
      }
    );

    this.updateState({
      phase: "PROCESS_RESULTS",
      download: {
        currentMbps: libreResult.downloadSpeed,
        finalMbps: libreResult.downloadSpeed,
        bytesTransferred: libreResult.downloadBytes,
        elapsedMs: libreResult.downloadDurationMs,
      },
      upload: {
        currentMbps: libreResult.uploadSpeed,
        finalMbps: libreResult.uploadSpeed,
        bytesTransferred: libreResult.uploadBytes,
        elapsedMs: libreResult.uploadDurationMs,
      },
      ping: {
        currentPing: libreResult.ping,
        minPing: libreResult.minPing,
        avgPing: libreResult.ping,
        medianPing: libreResult.ping,
        samples: [libreResult.ping],
      },
      jitter: { jitter: libreResult.jitter },
    });

    return aggregateResults({
      ping: this.state.ping,
      jitter: this.state.jitter,
      download: this.state.download,
      upload: this.state.upload,
    });
  }

  /**
   * Runs the full measured lifecycle once against a single server.
   * Primary: custom engine (bytes/duration ground truth).
   * Fallback: LibreSpeed worker for LibreSpeed backends only.
   */
  private async runAgainstServer(
    config: SpeedTestConfig,
    server: SpeedTestServer,
    signal: AbortSignal
  ): Promise<TestResults> {
    try {
      return await this.runCustomEngine(config, server, signal);
    } catch (primaryErr: unknown) {
      if (signal.aborted || (primaryErr as Error)?.name === "AbortError") {
        throw primaryErr;
      }

      if (detectServerBackend(server) !== "librespeed") {
        throw primaryErr;
      }

      console.warn(
        `[SpeedTest] Custom engine failed against ${server.baseUrl}, trying LibreSpeed worker:`,
        (primaryErr as Error)?.message
      );
      return await this.runLibreSpeedEngine(config, server, signal);
    }
  }

  /**
   * Executes the full speed test with automatic best-server selection and
   * failover to the next ranked server on failure.
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
        server: null,
      });

      // 2. SERVER DISCOVERY + BEST-SERVER SELECTION (latency-based, not geolocated)
      const candidates = config.servers && config.servers.length > 0
        ? config.servers
        : getServerList();

      if (candidates.length === 0) {
        throw new Error(
          "No remote test servers configured. Set NEXT_PUBLIC_LIBRESPEED_URL to your Railway backend URL (or NEXT_PUBLIC_SPEEDTEST_WORKER_URL to your Cloudflare Worker URL)."
        );
      }

      const selection = await selectBestServer({
        servers: candidates,
        probeCount: config.serverProbeCount ?? 4,
        signal,
        onStatus: (status) => {
          console.info("[SpeedTest Engine]", status);
        },
      });

      const ranks: ServerSelectionResult[] = selection.ranked;
      let lastFailure: Error | null = null;

      // 3. RUN THE TEST AGAINST THE BEST SERVER, FAILOVER DOWN THE RANKED LIST
      for (const rank of ranks) {
        if (signal.aborted) break;

        const serverInfo: SelectedServerInfo = {
          id: rank.server.id,
          name: rank.server.name,
          region: rank.server.region,
          baseUrl: rank.server.baseUrl,
          latencyMs: rank.latencyMs,
        };
        this.updateState({ server: serverInfo });

        try {
          const finalResults = await this.runAgainstServer(config, rank.server, signal);

          // 4. COMPLETED
          this.updateState({
            phase: "COMPLETED",
            results: finalResults,
          });

          this.isRunning = false;
          this.abortController = null;
          return finalResults;
        } catch (err: unknown) {
          if ((err as Error)?.name === "AbortError") {
            throw err; // user cancellation — no failover
          }
          lastFailure = err instanceof Error ? err : new Error(String(err));

          if (ranks.length > 1) {
            console.warn(
              `[SpeedTest Engine] Test failed against ${rank.server.name}, failing over to next server:`,
              lastFailure.message
            );
          }
        }
      }

      // All servers exhausted.
      if (signal.aborted) {
        this.updateState({ phase: "CANCELLED" });
        throw new DOMException("Speed test aborted by user", "AbortError");
      }

      const errorMessage = lastFailure?.message || "Speed test failed against all test servers";
      this.updateState({ phase: "ERROR", error: errorMessage });
      throw lastFailure ?? new Error(errorMessage);
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