import { useState, useMemo, useCallback } from "react";
import { evaluatePreFlight, MemorySafetyReport, OperationType } from "../utils/memoryGuard";

export interface UseToolPreFlightOptions {
  files: File[];
  operationType?: OperationType;
  estimatedPages?: number;
}

export interface UseToolPreFlightResult {
  report: MemorySafetyReport;
  isBlocked: boolean;
  isWarning: boolean;
  isSafe: boolean;
  dismissed: boolean;
  dismissWarning: () => void;
  resetDismissal: () => void;
}

/**
 * React hook that enforces Pre-flight memory checks before tool execution.
 * Classifies file batches into 'safe' | 'warning' | 'blocked' to avoid tab out-of-memory errors.
 */
export function useToolPreFlight({
  files,
  operationType = "general",
  estimatedPages = 0,
}: UseToolPreFlightOptions): UseToolPreFlightResult {
  const [dismissed, setDismissed] = useState(false);

  // Evaluate memory pressure whenever files or configuration change
  const report = useMemo(() => {
    return evaluatePreFlight({ files, operationType, estimatedPages });
  }, [files, operationType, estimatedPages]);

  const dismissWarning = useCallback(() => {
    setDismissed(true);
  }, []);

  const resetDismissal = useCallback(() => {
    setDismissed(false);
  }, []);

  const isBlocked = report.status === "blocked";
  const isWarning = report.status === "warning" && !dismissed;
  const isSafe = report.status === "safe";

  return {
    report,
    isBlocked,
    isWarning,
    isSafe,
    dismissed,
    dismissWarning,
    resetDismissal,
  };
}
