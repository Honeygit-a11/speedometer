/**
 * Browser API Feature Detection & Diagnostic Utility
 */

export interface CompatibilityCheckResult {
  supported: boolean;
  missingFeatures: string[];
}

/**
 * Checks for modern browser networking capabilities required for accurate speed testing.
 */
export function checkBrowserCompatibility(): CompatibilityCheckResult {
  const missingFeatures: string[] = [];

  if (typeof window !== "undefined") {
    if (typeof fetch === "undefined") {
      missingFeatures.push("Fetch API");
    }

    if (typeof ReadableStream === "undefined") {
      missingFeatures.push("ReadableStream");
    }

    if (typeof AbortController === "undefined") {
      missingFeatures.push("AbortController");
    }

    if (typeof performance === "undefined" || typeof performance.now !== "function") {
      missingFeatures.push("High-Resolution Timing (performance.now)");
    }
  }

  return {
    supported: missingFeatures.length === 0,
    missingFeatures,
  };
}
