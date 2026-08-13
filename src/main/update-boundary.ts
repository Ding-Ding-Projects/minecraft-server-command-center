import type { UpdateBoundary } from "../shared/desktop-api";

/**
 * The desktop foundation intentionally has no update transport. Squirrel
 * artifacts can be produced, but no client-side feed lookup, download, hash
 * verification, staging, or restart route may be implied until it is built.
 */
export function getUpdateBoundary(): UpdateBoundary {
  return {
    state: "unavailable",
    message: "Automatic updates are not configured in this desktop foundation.",
    reason: "No verified update feed, download integrity route, staged install flow, or restart-and-recovery implementation exists yet."
  };
}

