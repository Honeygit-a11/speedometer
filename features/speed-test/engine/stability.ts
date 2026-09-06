import { LoadedLatency, NetworkStability } from "@/types";

/**
 * Grades bufferbloat based on latency inflation during active network saturation.
 */
export function calculateBufferbloatGrade(
  idleMs: number,
  downloadLoadedMs: number,
  uploadLoadedMs: number
): LoadedLatency {
  const downloadDelta = Math.max(0, Number((downloadLoadedMs - idleMs).toFixed(1)));
  const uploadDelta = Math.max(0, Number((uploadLoadedMs - idleMs).toFixed(1)));
  const maxDelta = Math.max(downloadDelta, uploadDelta);

  let grade: "A+" | "A" | "B" | "C" | "D" | "F";
  if (maxDelta <= 5) {
    grade = "A+";
  } else if (maxDelta <= 15) {
    grade = "A";
  } else if (maxDelta <= 35) {
    grade = "B";
  } else if (maxDelta <= 75) {
    grade = "C";
  } else if (maxDelta <= 150) {
    grade = "D";
  } else {
    grade = "F";
  }

  return {
    idleMs: Number(idleMs.toFixed(1)),
    downloadLoadedMs: Number(downloadLoadedMs.toFixed(1)),
    uploadLoadedMs: Number(uploadLoadedMs.toFixed(1)),
    downloadDeltaMs: downloadDelta,
    uploadDeltaMs: uploadDelta,
    bufferbloatGrade: grade,
  };
}

/**
 * Calculates connection stability based on speed variance and latency variation.
 */
export function calculateNetworkStability(
  speedSamples: number[],
  pingSamples: number[],
  jitterMs: number
): NetworkStability {
  // 1. Speed consistency (Coefficient of Variation)
  let speedConsistency = 100;
  if (speedSamples.length > 2) {
    const mean = speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length;
    if (mean > 0) {
      const variance =
        speedSamples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        speedSamples.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / mean;
      speedConsistency = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
    }
  }

  // 2. Latency consistency
  let latencyConsistency = 100;
  if (pingSamples.length > 0) {
    const avgPing = pingSamples.reduce((a, b) => a + b, 0) / pingSamples.length;
    if (avgPing > 0) {
      const latencyRatio = jitterMs / avgPing;
      latencyConsistency = Math.max(0, Math.min(100, Math.round((1 - latencyRatio) * 100)));
    }
  }

  // 3. Composite score (60% speed consistency, 40% latency consistency)
  const compositeScore = Math.round(0.6 * speedConsistency + 0.4 * latencyConsistency);

  let rating: "Excellent" | "Good" | "Moderate" | "Unstable";
  if (compositeScore >= 85) {
    rating = "Excellent";
  } else if (compositeScore >= 70) {
    rating = "Good";
  } else if (compositeScore >= 50) {
    rating = "Moderate";
  } else {
    rating = "Unstable";
  }

  return {
    score: compositeScore,
    speedConsistency,
    latencyConsistency,
    rating,
  };
}
