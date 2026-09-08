/**
 * Configuration for LibreSpeed test run
 */
export interface LibreSpeedConfig {
  /** Base URL of the LibreSpeed server (e.g. http://127.0.0.1:8888 or https://xyz.railway.app) */
  serverUrl: string;
  /** Number of ping latency probes to execute */
  pingProbes?: number;
  /** Duration of download measurement in milliseconds */
  downloadDurationMs?: number;
  /** Minimum download duration */
  downloadMinDurationMs?: number;
  /** Duration of upload measurement in milliseconds */
  uploadDurationMs?: number;
  /** Minimum upload duration */
  uploadMinDurationMs?: number;
  /** Warmup period in ms */
  warmupMs?: number;
  /** Concurrency level (number of parallel streams) */
  concurrency?: number;
  /** Chunk size in MB for download */
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

function computeRfcJitter(samples: number[]): number {
  if (samples.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < samples.length; i++) {
    sum += Math.abs(samples[i] - samples[i - 1]);
  }
  return Number((sum / (samples.length - 1)).toFixed(1));
}

/**
 * Adapter client managing LibreSpeed execution.
 *
 * In browser environments, it spawns the official LibreSpeed Web Worker
 * (/speedtest_worker.js) for true multi-threaded network testing.
 * In headless/Node.js testing environments, it executes the equivalent LibreSpeed
 * streaming algorithm against the LibreSpeed backend endpoints.
 */
export class LibreSpeedClient {
  private activeWorker: Worker | null = null;
  private abortController: AbortController | null = null;
  private isRunning = false;

  public async runTest(
    config: LibreSpeedConfig,
    onTelemetry: (telemetry: LibreSpeedTelemetry) => void
  ): Promise<LibreSpeedResults> {
    if (this.isRunning) {
      throw new Error("A speed test is already running.");
    }

    this.isRunning = true;
    const serverUrl = config.serverUrl.replace(/\/+$/, "");

    // -----------------------------------------------------------------
    // 1. OFFICIAL LIBRESPEED WEB WORKER (Browser Runtime)
    // -----------------------------------------------------------------
    if (typeof window !== "undefined" && typeof Worker !== "undefined") {
      return new Promise<LibreSpeedResults>((resolve, reject) => {
        try {
          const worker = new Worker("/speedtest_worker.js");
          this.activeWorker = worker;

          const pingProbes = config.pingProbes || 10;
          const dlSec = Math.max(3, Math.round((config.downloadDurationMs || 8000) / 1000));
          const ulSec = Math.max(3, Math.round((config.uploadDurationMs || 8000) / 1000));

          const workerSettings = {
            url_dl: `${serverUrl}/garbage`,
            url_ul: `${serverUrl}/empty`,
            url_ping: `${serverUrl}/empty`,
            url_getIp: `${serverUrl}/getIP`,
            time_dl_max: dlSec,
            time_ul_max: ulSec,
            count_ping: pingProbes,
            test_order: "P_D_U", // Official LibreSpeed test sequence: Ping -> Download -> Upload
            xhr_dlMultistream: config.concurrency || 6,
            xhr_ulMultistream: config.concurrency || 3,
            time_dlGraceTime: 1.5,
            time_ulGraceTime: 1.5,
            garbagePhp_chunkSize: config.downloadChunkSizeMb || 4,
            time_auto: false,
            overheadCompensationFactor: 1.06,
          };

          let lastState = -1;
          let pollInterval: NodeJS.Timeout | null = null;

          const cleanup = () => {
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            if (this.activeWorker === worker) {
              this.activeWorker = null;
            }
            this.isRunning = false;
            try {
              worker.terminate();
            } catch {}
          };

          worker.onmessage = (e: MessageEvent) => {
            try {
              const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
              const state = data.testState;
              const dlMbps = parseFloat(data.dlStatus) || 0;
              const ulMbps = parseFloat(data.ulStatus) || 0;
              const pingMs = parseFloat(data.pingStatus) || 0;
              const jitterMs = parseFloat(data.jitterStatus) || 0;

              // Phase 2: Ping / Jitter
              if (state === 2) {
                onTelemetry({
                  phase: "PING",
                  currentMbps: 0,
                  bytesTransferred: 0,
                  progress: Math.round((data.pingProgress || 0) * 100),
                  currentPing: pingMs,
                  avgPing: pingMs,
                  jitter: jitterMs,
                });
              }
              // Phase 1: Download
              else if (state === 1) {
                onTelemetry({
                  phase: "DOWNLOAD",
                  currentMbps: dlMbps,
                  bytesTransferred: Math.round((dlMbps * (dlSec * 1000 * (data.dlProgress || 0.1))) / 8 / 1000),
                  progress: Math.round((data.dlProgress || 0) * 100),
                  streamCount: config.concurrency || 6,
                });
              }
              // Phase 3: Upload
              else if (state === 3) {
                onTelemetry({
                  phase: "UPLOAD",
                  currentMbps: ulMbps,
                  bytesTransferred: Math.round((ulMbps * (ulSec * 1000 * (data.ulProgress || 0.1))) / 8 / 1000),
                  progress: Math.round((data.ulProgress || 0) * 100),
                  streamCount: config.concurrency || 3,
                });
              }
              // Phase 4: Finished
              else if (state === 4) {
                cleanup();

                const results: LibreSpeedResults = {
                  downloadSpeed: dlMbps,
                  uploadSpeed: ulMbps,
                  ping: pingMs,
                  jitter: jitterMs,
                  minPing: pingMs,
                  downloadBytes: Math.round((dlMbps * dlSec * 125000)),
                  uploadBytes: Math.round((ulMbps * ulSec * 125000)),
                  downloadDurationMs: dlSec * 1000,
                  uploadDurationMs: ulSec * 1000,
                  serverUrl,
                  timestamp: Date.now(),
                };

                onTelemetry({
                  phase: "COMPLETED",
                  currentMbps: 0,
                  bytesTransferred: results.downloadBytes + results.uploadBytes,
                  progress: 100,
                  currentPing: pingMs,
                  avgPing: pingMs,
                  jitter: jitterMs,
                });

                resolve(results);
              }
              // Phase 5: Aborted
              else if (state === 5) {
                cleanup();
                onTelemetry({
                  phase: "CANCELLED",
                  currentMbps: 0,
                  bytesTransferred: 0,
                  progress: 0,
                });
                reject(new DOMException("Test aborted", "AbortError"));
              }

              lastState = state;
            } catch (parseErr) {
              console.warn("[LibreSpeed Worker] Parse error:", parseErr);
            }
          };

          worker.onerror = (errEvent) => {
            cleanup();
            onTelemetry({
              phase: "ERROR",
              currentMbps: 0,
              bytesTransferred: 0,
              progress: 0,
            });
            reject(new Error(errEvent.message || "LibreSpeed Web Worker error"));
          };

          // Start official LibreSpeed worker
          worker.postMessage("start " + JSON.stringify(workerSettings));

          // Poll worker for real-time status every 100ms
          pollInterval = setInterval(() => {
            try {
              worker.postMessage("status");
            } catch {
              if (pollInterval) clearInterval(pollInterval);
            }
          }, 100);
        } catch (workerInitErr) {
          this.isRunning = false;
          reject(workerInitErr);
        }
      });
    }

    // -----------------------------------------------------------------
    // 2. HEADLESS / NODE.JS FALLBACK RUNNER
    // -----------------------------------------------------------------
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const pingProbes = config.pingProbes || 10;
    const downloadDurationMs = config.downloadDurationMs || 8000;
    const uploadDurationMs = config.uploadDurationMs || 8000;
    const warmupMs = config.warmupMs || 1500;
    const concurrency = config.concurrency || 4;
    const downloadChunkSizeMb = config.downloadChunkSizeMb || 4;

    try {
      onTelemetry({
        phase: "PING",
        currentMbps: 0,
        bytesTransferred: 0,
        progress: 0,
      });

      const pingSamples: number[] = [];

      for (let i = 0; i < pingProbes; i++) {
        if (signal.aborted) throw new DOMException("Test aborted", "AbortError");

        const t0 = performance.now();
        const probeUrl = `${serverUrl}/empty?r=${Math.random()}`;

        try {
          const res = await fetch(probeUrl, {
            method: "GET",
            cache: "no-store",
            signal,
          });

          if (!res.ok) {
            throw new Error(`Ping probe failed with status ${res.status}`);
          }

          const rtt = performance.now() - t0;
          pingSamples.push(rtt);

          const curJitter = computeRfcJitter(pingSamples);
          const avgPing =
            pingSamples.reduce((a, b) => a + b, 0) / pingSamples.length;

          onTelemetry({
            phase: "PING",
            currentMbps: 0,
            bytesTransferred: 0,
            progress: Math.round(((i + 1) / pingProbes) * 100),
            currentPing: rtt,
            avgPing,
            jitter: curJitter,
          });
        } catch (err: any) {
          if (err.name === "AbortError") throw err;
          console.warn(`[LibreSpeed] Ping probe dropped:`, err.message);
        }

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (pingSamples.length === 0) {
        throw new Error("All ping probes failed. Server unreachable.");
      }

      const sortedPings = [...pingSamples].sort((a, b) => a - b);
      const medianPing = sortedPings[Math.floor(sortedPings.length / 2)];
      const minPing = sortedPings[0];
      const finalJitter = computeRfcJitter(pingSamples);

      onTelemetry({
        phase: "DOWNLOAD",
        currentMbps: 0,
        bytesTransferred: 0,
        progress: 0,
      });

      let totalDownloadBytes = 0;
      let postWarmupDownloadBytes = 0;
      let downloadWarmupComplete = false;
      let downloadStartTime = performance.now();
      let downloadWarmupEndTime = 0;

      let lastWindowDownloadBytes = 0;
      let lastWindowTime = performance.now();
      let currentDownloadMbps = 0;

      const downloadInterval = setInterval(() => {
        const now = performance.now();
        const elapsed = now - downloadStartTime;
        const windowElapsed = (now - lastWindowTime) / 1000;

        if (windowElapsed > 0.05) {
          const deltaBytes = totalDownloadBytes - lastWindowDownloadBytes;
          const instantaneousMbps = (deltaBytes * 8) / (windowElapsed * 1_000_000);
          currentDownloadMbps = currentDownloadMbps === 0
            ? instantaneousMbps
            : currentDownloadMbps * 0.7 + instantaneousMbps * 0.3;

          lastWindowDownloadBytes = totalDownloadBytes;
          lastWindowTime = now;
        }

        if (!downloadWarmupComplete && elapsed >= warmupMs) {
          downloadWarmupComplete = true;
          downloadWarmupEndTime = now;
          postWarmupDownloadBytes = 0;
        }

        const progress = Math.min(
          99,
          Math.round((elapsed / downloadDurationMs) * 100)
        );

        onTelemetry({
          phase: "DOWNLOAD",
          currentMbps: Math.max(0, currentDownloadMbps),
          bytesTransferred: totalDownloadBytes,
          progress,
          streamCount: concurrency,
        });
      }, 100);

      const downloadWorkers = Array.from({ length: concurrency }, async () => {
        while (!signal.aborted) {
          const elapsed = performance.now() - downloadStartTime;
          if (elapsed >= downloadDurationMs) break;

          const url = `${serverUrl}/garbage?ckSize=${downloadChunkSizeMb}&r=${Math.random()}`;
          try {
            const res = await fetch(url, { cache: "no-store", signal });
            if (!res.ok || !res.body) break;

            const reader = res.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                totalDownloadBytes += value.length;
                if (downloadWarmupComplete) {
                  postWarmupDownloadBytes += value.length;
                }
              }
              if (performance.now() - downloadStartTime >= downloadDurationMs) {
                reader.cancel().catch(() => {});
                break;
              }
            }
          } catch (err: any) {
            if (err.name === "AbortError") break;
            break;
          }
        }
      });

      await Promise.all(downloadWorkers);
      clearInterval(downloadInterval);

      const downloadEndTime = performance.now();
      const measuredDownloadDurationSec =
        (downloadEndTime - (downloadWarmupEndTime || downloadStartTime)) / 1000;

      const finalDownloadMbps =
        measuredDownloadDurationSec > 0 && postWarmupDownloadBytes > 0
          ? Number(
              (
                (postWarmupDownloadBytes * 8) /
                (measuredDownloadDurationSec * 1_000_000)
              ).toFixed(2)
            )
          : Number(
              (
                (totalDownloadBytes * 8) /
                (((downloadEndTime - downloadStartTime) / 1000) * 1_000_000)
              ).toFixed(2)
            );

      onTelemetry({
        phase: "UPLOAD",
        currentMbps: 0,
        bytesTransferred: 0,
        progress: 0,
      });

      let totalUploadBytes = 0;
      let postWarmupUploadBytes = 0;
      let uploadWarmupComplete = false;
      let uploadStartTime = performance.now();
      let uploadWarmupEndTime = 0;

      let lastWindowUploadBytes = 0;
      let lastWindowUploadTime = performance.now();
      let currentUploadMbps = 0;

      const UPLOAD_CHUNK_SIZE = 512 * 1024;
      const uploadPayload = new Uint8Array(UPLOAD_CHUNK_SIZE);
      for (let i = 0; i < UPLOAD_CHUNK_SIZE; i++) {
        uploadPayload[i] = i % 256;
      }

      const uploadInterval = setInterval(() => {
        const now = performance.now();
        const elapsed = now - uploadStartTime;
        const windowElapsed = (now - lastWindowUploadTime) / 1000;

        if (windowElapsed > 0.05) {
          const deltaBytes = totalUploadBytes - lastWindowUploadBytes;
          const instantaneousMbps = (deltaBytes * 8) / (windowElapsed * 1_000_000);
          currentUploadMbps = currentUploadMbps === 0
            ? instantaneousMbps
            : currentUploadMbps * 0.7 + instantaneousMbps * 0.3;

          lastWindowUploadBytes = totalUploadBytes;
          lastWindowUploadTime = now;
        }

        if (!uploadWarmupComplete && elapsed >= warmupMs) {
          uploadWarmupComplete = true;
          uploadWarmupEndTime = now;
          postWarmupUploadBytes = 0;
        }

        const progress = Math.min(
          99,
          Math.round((elapsed / uploadDurationMs) * 100)
        );

        onTelemetry({
          phase: "UPLOAD",
          currentMbps: Math.max(0, currentUploadMbps),
          bytesTransferred: totalUploadBytes,
          progress,
          streamCount: concurrency,
        });
      }, 100);

      const uploadWorkers = Array.from({ length: concurrency }, async () => {
        while (!signal.aborted) {
          const elapsed = performance.now() - uploadStartTime;
          if (elapsed >= uploadDurationMs) break;

          const url = `${serverUrl}/empty?r=${Math.random()}`;
          try {
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/octet-stream" },
              body: uploadPayload,
              signal,
            });

            if (res.ok) {
              const resJson = await res.json().catch(() => ({}));
              const confirmedBytes =
                typeof resJson.bytesReceived === "number"
                  ? resJson.bytesReceived
                  : UPLOAD_CHUNK_SIZE;

              totalUploadBytes += confirmedBytes;
              if (uploadWarmupComplete) {
                postWarmupUploadBytes += confirmedBytes;
              }
            }
          } catch (err: any) {
            if (err.name === "AbortError") break;
            break;
          }
        }
      });

      await Promise.all(uploadWorkers);
      clearInterval(uploadInterval);

      const uploadEndTime = performance.now();
      const measuredUploadDurationSec =
        (uploadEndTime - (uploadWarmupEndTime || uploadStartTime)) / 1000;

      const finalUploadMbps =
        measuredUploadDurationSec > 0 && postWarmupUploadBytes > 0
          ? Number(
              (
                (postWarmupUploadBytes * 8) /
                (measuredUploadDurationSec * 1_000_000)
              ).toFixed(2)
            )
          : Number(
              (
                (totalUploadBytes * 8) /
                (((uploadEndTime - uploadStartTime) / 1000) * 1_000_000)
              ).toFixed(2)
            );

      const finalResults: LibreSpeedResults = {
        downloadSpeed: finalDownloadMbps,
        uploadSpeed: finalUploadMbps,
        ping: Number(medianPing.toFixed(1)),
        jitter: finalJitter,
        minPing: Number(minPing.toFixed(1)),
        downloadBytes: totalDownloadBytes,
        uploadBytes: totalUploadBytes,
        downloadDurationMs: Math.round(downloadEndTime - downloadStartTime),
        uploadDurationMs: Math.round(uploadEndTime - uploadStartTime),
        serverUrl,
        timestamp: Date.now(),
      };

      onTelemetry({
        phase: "COMPLETED",
        currentMbps: 0,
        bytesTransferred: totalDownloadBytes + totalUploadBytes,
        progress: 100,
        currentPing: medianPing,
        avgPing: medianPing,
        jitter: finalJitter,
      });

      return finalResults;
    } catch (err: any) {
      if (err.name === "AbortError") {
        onTelemetry({
          phase: "CANCELLED",
          currentMbps: 0,
          bytesTransferred: 0,
          progress: 0,
        });
      } else {
        onTelemetry({
          phase: "ERROR",
          currentMbps: 0,
          bytesTransferred: 0,
          progress: 0,
        });
      }
      throw err;
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  public cancel(): void {
    if (this.activeWorker) {
      try {
        this.activeWorker.postMessage("abort");
        this.activeWorker.terminate();
      } catch {}
      this.activeWorker = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isRunning = false;
  }
}

export const libreSpeedClient = new LibreSpeedClient();
