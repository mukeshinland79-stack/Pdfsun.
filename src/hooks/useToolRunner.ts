import { useState, useCallback, useRef, useEffect } from "react";
import {
  ToolLifecycleState,
  ToolError,
  ToolExecutionSnapshot,
  normalizeToolError,
  canTransition,
} from "../lib/toolStateMachine";
import { registerGuardedBlobUrl, revokeGuardedBlobUrl } from "../utils/memoryGuard";

export interface UseToolRunnerOptions {
  onSuccess?: (blobUrl: string, fileName: string) => void;
  onError?: (error: ToolError) => void;
}

export interface UseToolRunnerResult {
  snapshot: ToolExecutionSnapshot;
  isBusy: boolean;
  canExecute: boolean;
  canDownload: boolean;
  startExecution: () => boolean; // returns true if lock acquired
  updateProgress: (percent: number, message?: string) => void;
  setReady: (blobUrl: string, fileName: string, sizeBytes?: number) => void;
  markDownloaded: () => void;
  setError: (err: any) => void;
  cancel: () => void;
  reset: () => void;
  getAbortSignal: () => AbortSignal | null;
}

export function useToolRunner(options: UseToolRunnerOptions = {}): UseToolRunnerResult {
  const [snapshot, setSnapshot] = useState<ToolExecutionSnapshot>({
    state: "idle",
    progressPercent: 0,
    statusMessage: "",
    error: null,
    outputBlobUrl: null,
    outputFileName: null,
    outputSizeBytes: null,
    startTime: null,
    endTime: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  // Clean up Blob URLs on unmount
  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        revokeGuardedBlobUrl(activeBlobUrlRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const isBusy =
    snapshot.state === "validating" ||
    snapshot.state === "pre_flight_check" ||
    snapshot.state === "processing";

  const canExecute = !isBusy;
  const canDownload = snapshot.state === "download_ready" || snapshot.state === "downloaded";

  const startExecution = useCallback((): boolean => {
    if (isBusy) return false; // Enforce single submission: prevent double execution

    if (activeBlobUrlRef.current) {
      revokeGuardedBlobUrl(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }

    abortControllerRef.current = new AbortController();

    setSnapshot({
      state: "processing",
      progressPercent: 0,
      statusMessage: "Initializing engine...",
      error: null,
      outputBlobUrl: null,
      outputFileName: null,
      outputSizeBytes: null,
      startTime: Date.now(),
      endTime: null,
    });

    return true;
  }, [isBusy]);

  const updateProgress = useCallback((percent: number, message?: string) => {
    setSnapshot((prev) => {
      if (prev.state !== "processing" && prev.state !== "validating") return prev;
      return {
        ...prev,
        progressPercent: Math.min(100, Math.max(0, percent)),
        statusMessage: message || prev.statusMessage,
      };
    });
  }, []);

  const setReady = useCallback(
    (blobUrl: string, fileName: string, sizeBytes?: number) => {
      registerGuardedBlobUrl(blobUrl);
      activeBlobUrlRef.current = blobUrl;

      setSnapshot((prev) => ({
        ...prev,
        state: "download_ready",
        progressPercent: 100,
        statusMessage: "Document ready for download",
        outputBlobUrl: blobUrl,
        outputFileName: fileName,
        outputSizeBytes: sizeBytes ?? null,
        endTime: Date.now(),
      }));

      options.onSuccess?.(blobUrl, fileName);
    },
    [options]
  );

  const markDownloaded = useCallback(() => {
    setSnapshot((prev) => ({
      ...prev,
      state: "downloaded",
      statusMessage: "Downloaded successfully ✓",
    }));
  }, []);

  const setError = useCallback(
    (err: any) => {
      const normalized = normalizeToolError(err);

      setSnapshot((prev) => ({
        ...prev,
        state: "failed",
        error: normalized,
        statusMessage: normalized.message,
        endTime: Date.now(),
      }));

      options.onError?.(normalized);
    },
    [options]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setSnapshot((prev) => ({
      ...prev,
      state: "cancelled",
      statusMessage: "Operation cancelled",
      endTime: Date.now(),
    }));
  }, []);

  const reset = useCallback(() => {
    if (activeBlobUrlRef.current) {
      revokeGuardedBlobUrl(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setSnapshot({
      state: "idle",
      progressPercent: 0,
      statusMessage: "",
      error: null,
      outputBlobUrl: null,
      outputFileName: null,
      outputSizeBytes: null,
      startTime: null,
      endTime: null,
    });
  }, []);

  const getAbortSignal = useCallback(() => {
    return abortControllerRef.current?.signal || null;
  }, []);

  return {
    snapshot,
    isBusy,
    canExecute,
    canDownload,
    startExecution,
    updateProgress,
    setReady,
    markDownloaded,
    setError,
    cancel,
    reset,
    getAbortSignal,
  };
}
