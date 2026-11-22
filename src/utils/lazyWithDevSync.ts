import React, { lazy } from "react";

export type DevDepsSyncState =
  | "UNINITIALIZED"
  | "CHECKING"
  | "HASH_MATCH"
  | "HASH_MISMATCH"
  | "RELOAD_COMMITTED"
  | "RELOAD_UNAVAILABLE"
  | "PROBE_FAILED";

export interface DevDepsSyncOutcome {
  state: DevDepsSyncState;
  allowImport: boolean;
}

type DevDepsSyncChecker = (force?: boolean) => Promise<DevDepsSyncOutcome | boolean>;

/**
 * Dev-only pre-import guard that synchronizes Vite's optimized-deps browserHash
 * before executing dynamic import(). Prevents stale preview tabs (hmr: false)
 * from loading a second React instance (?v=...).
 *
 * In production builds (import.meta.env.DEV === false), Vite dead-code-eliminates
 * the entire dev branch and returns React.lazy(loader) directly.
 */
export function lazyWithDevSync<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  if (!import.meta.env.DEV) {
    return lazy(loader);
  }

  return lazy(async () => {
    if (typeof window !== "undefined") {
      const checkSync = (
        window as unknown as {
          __PDFSUN_CHECK_DEV_DEPS_SYNC__?: DevDepsSyncChecker;
        }
      ).__PDFSUN_CHECK_DEV_DEPS_SYNC__;

      if (typeof checkSync === "function") {
        let outcome: DevDepsSyncOutcome | boolean;
        try {
          outcome = await checkSync(true);
        } catch {
          // Unexpected rejection: fail closed so an incompatible React chunk is never imported
          throw new Error("PDFSun dev runtime synchronization interrupted. Please refresh.");
        }

        if (typeof outcome === "boolean") {
          if (outcome) {
            return new Promise<{ default: T }>(() => {});
          }
        } else if (outcome && outcome.allowImport === false) {
          if (outcome.state === "RELOAD_COMMITTED") {
            // Keep Suspense fallback mounted while browser completes navigation
            return new Promise<{ default: T }>(() => {});
          }
          // RELOAD_UNAVAILABLE / HASH_MISMATCH / PROBE_FAILED: fail closed without reload loop
          throw new Error(
            outcome.state === "PROBE_FAILED"
              ? "PDFSun dev server synchronization unavailable. Please retry or refresh."
              : "PDFSun dev runtime refresh required. Please reload the workspace."
          );
        }
      }
    }
    return loader();
  });
}
