import { useState, useRef, useCallback, useEffect } from "react";
import { executionLockManager } from "../lib/executionLockService";

export interface ExecutionLockOptions {
  /**
   * Action name used to scope idempotency
   */
  actionName?: string;
  /**
   * Unique identifier or payload for idempotency key generation
   */
  payloadId?: string | number | Record<string, any>;
  /**
   * Minimum debounce window in ms to prevent accidental rapid double clicks
   * @default 300
   */
  debounceMs?: number;
  /**
   * Max safety timeout in ms after which lock auto-releases if not freed
   * @default 10000
   */
  lockTimeoutMs?: number;
}

export function useExecutionLock() {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const isLockedRef = useRef<boolean>(false);
  const lastExecutionTimeRef = useRef<number>(0);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // Sync state with ref
  const setLockState = useCallback((locked: boolean) => {
    isLockedRef.current = locked;
    setIsLocked(locked);
  }, []);

  /**
   * Wraps an asynchronous task with synchronous reference locking and idempotency protection
   */
  const executeWithLock = useCallback(
    async <T>(
      fn: (signal: AbortSignal) => Promise<T>,
      options: ExecutionLockOptions = {}
    ): Promise<T | null> => {
      const {
        actionName = "default_action",
        payloadId,
        debounceMs = 350,
        lockTimeoutMs = 12000,
      } = options;

      const now = Date.now();

      // 1. Debounce check: Reject micro-double clicks within debounce window
      if (now - lastExecutionTimeRef.current < debounceMs) {
        console.warn(`[useExecutionLock] Execution debounced (${now - lastExecutionTimeRef.current}ms < ${debounceMs}ms)`);
        return null;
      }

      // 2. Synchronous ref lock check (0ms overhead before React state update)
      if (isLockedRef.current) {
        console.warn("[useExecutionLock] Action rejected: synchronous ref execution lock active");
        return null;
      }

      // 3. Manager Idempotency key acquisition check
      const lockKey = executionLockManager.generateIdempotencyKey(actionName, payloadId);
      const abortController = new AbortController();

      if (!executionLockManager.acquire(lockKey, lockTimeoutMs, abortController)) {
        console.warn(`[useExecutionLock] Action rejected: active lock held for key "${lockKey}"`);
        return null;
      }

      // Lock acquired successfully!
      lastExecutionTimeRef.current = now;
      setLockState(true);
      activeAbortControllerRef.current = abortController;

      try {
        const result = await fn(abortController.signal);
        return result;
      } catch (error: any) {
        if (error?.name === "AbortError") {
          console.log("[useExecutionLock] Action was cancelled safely");
        } else {
          console.error("[useExecutionLock] Action execution error:", error);
        }
        throw error;
      } finally {
        // Guaranteed cleanup & lock release regardless of success or failure
        executionLockManager.release(lockKey);
        activeAbortControllerRef.current = null;
        setLockState(false);
      }
    },
    [setLockState]
  );

  /**
   * Cancels any ongoing locked execution safely
   */
  const cancelExecution = useCallback(() => {
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort("Execution cancelled by user");
      activeAbortControllerRef.current = null;
    }
    setLockState(false);
    executionLockManager.clearAll();
  }, [setLockState]);

  // Cleanup on unmount to prevent leaks
  useEffect(() => {
    return () => {
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort("Unmounted");
      }
      executionLockManager.clearAll();
    };
  }, []);

  return {
    isLocked,
    isLockedRef,
    executeWithLock,
    cancelExecution,
  };
}
