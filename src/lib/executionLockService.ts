/**
 * PDFSun Execution Lock & Idempotency Service
 * Guarantees single-execution for asynchronous operations, file processing, 
 * network requests, and UI triggers across the application lifecycle.
 */

interface LockEntry {
  key: string;
  timestamp: number;
  timer: ReturnType<typeof setTimeout>;
  abortController?: AbortController;
}

class ExecutionLockManager {
  private activeLocks: Map<string, LockEntry> = new Map();
  private defaultTtlMs: number = 8000; // 8 second safety timeout for PDF processing locks

  /**
   * Generates a deterministic idempotency key based on action type and payload identifier
   */
  public generateIdempotencyKey(actionName: string, identifier?: string | number | Record<string, any>): string {
    let payloadStr = "";
    if (identifier) {
      if (typeof identifier === "object") {
        try {
          payloadStr = JSON.stringify(identifier);
        } catch {
          payloadStr = String(identifier);
        }
      } else {
        payloadStr = String(identifier);
      }
    }
    return `lock:${actionName}:${payloadStr}`;
  }

  /**
   * Attempts to acquire an execution lock.
   * Returns true if lock was successfully acquired (first request).
   * Returns false if lock is already held (duplicate request suppressed).
   */
  public acquire(key: string, ttlMs: number = this.defaultTtlMs, abortController?: AbortController): boolean {
    const existing = this.activeLocks.get(key);
    if (existing) {
      // Already locked - duplicate execution detected!
      console.warn(`[ExecutionLockManager] Duplicate trigger suppressed for key: "${key}"`);
      return false;
    }

    // Set auto-release timer to prevent permanent deadlocks if process crashes
    const timer = setTimeout(() => {
      this.release(key);
    }, ttlMs);

    this.activeLocks.set(key, {
      key,
      timestamp: Date.now(),
      timer,
      abortController,
    });

    return true;
  }

  /**
   * Releases an active execution lock immediately
   */
  public release(key: string): void {
    const entry = this.activeLocks.get(key);
    if (entry) {
      clearTimeout(entry.timer);
      this.activeLocks.delete(key);
    }
  }

  /**
   * Checks if a key is currently locked
   */
  public isLocked(key: string): boolean {
    return this.activeLocks.has(key);
  }

  /**
   * Aborts and releases any active task associated with the key
   */
  public cancelAndRelease(key: string): void {
    const entry = this.activeLocks.get(key);
    if (entry) {
      if (entry.abortController) {
        try {
          entry.abortController.abort("Duplicate request cancelled");
        } catch (e) {
          console.error("Failed to abort request:", e);
        }
      }
      this.release(key);
    }
  }

  /**
   * Clears all active locks
   */
  public clearAll(): void {
    this.activeLocks.forEach((entry) => clearTimeout(entry.timer));
    this.activeLocks.clear();
  }
}

export const executionLockManager = new ExecutionLockManager();
