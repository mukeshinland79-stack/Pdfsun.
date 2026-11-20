import crypto from "crypto";

/**
 * Shared persistent state interfaces for distributed rate limiting and token revocation.
 *
 * IMPORTANT ARCHITECTURAL HONESTY:
 * - In serverless (Vercel) or multi-replica Cloud Run deployments, process-local `Map` / `Set`
 *   state is NOT globally consistent across cold starts or horizontally scaled instances.
 * - When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured, this module
 *   routes rate-limit counters and revoked-token checks through shared Redis REST storage.
 * - When those environment variables are absent, it explicitly falls back to process-local memory
 *   and reports `distributedReliable: false` in diagnostics rather than claiming global consistency.
 */

export interface DistributedRateLimitResult {
  count: number;
  limit: number;
  remaining: number;
  resetAtMs: number;
  allowed: boolean;
  backend: "upstash-redis-rest" | "process-local-memory";
}

export interface SharedRateLimitStore {
  readonly backend: "upstash-redis-rest" | "process-local-memory";
  readonly distributedReliable: boolean;
  consumeWindow(key: string, maxRequests: number, windowMs: number): Promise<DistributedRateLimitResult>;
}

export interface SharedTokenRevocationStore {
  readonly backend: "upstash-redis-rest" | "process-local-memory";
  readonly distributedReliable: boolean;
  revokeToken(token: string, ttlSeconds?: number): Promise<void>;
  isTokenRevoked(token: string): Promise<boolean>;
}

export interface DistributedStateDiagnostics {
  mode: "upstash-redis-rest" | "process-local-memory";
  distributedReliable: boolean;
  rateLimitingShared: boolean;
  tokenRevocationShared: boolean;
  statusNote: string;
}

const DEFAULT_REVOCATION_TTL_SEC = 7 * 24 * 3600; // 7 days (matches max session lifetime)

function hashTokenForStorage(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getUpstashConfig(): { url: string; token: string } | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL || "").trim().replace(/\/+$/, "");
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  if (
    !url ||
    !token ||
    !url.startsWith("https://") ||
    url.includes("YOUR_UPSTASH") ||
    token.includes("YOUR_UPSTASH")
  ) {
    return null;
  }
  return { url, token };
}

class ProcessLocalStateStore implements SharedRateLimitStore, SharedTokenRevocationStore {
  readonly backend = "process-local-memory" as const;
  readonly distributedReliable = false;

  private windows = new Map<string, { count: number; resetAtMs: number }>();
  private revokedTokenHashes = new Map<string, number>();

  async consumeWindow(key: string, maxRequests: number, windowMs: number): Promise<DistributedRateLimitResult> {
    const now = Date.now();
    const existing = this.windows.get(key);

    if (!existing || now >= existing.resetAtMs) {
      const resetAtMs = now + windowMs;
      this.windows.set(key, { count: 1, resetAtMs });
      return {
        count: 1,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - 1),
        resetAtMs,
        allowed: true,
        backend: this.backend,
      };
    }

    existing.count += 1;
    return {
      count: existing.count,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - existing.count),
      resetAtMs: existing.resetAtMs,
      allowed: existing.count <= maxRequests,
      backend: this.backend,
    };
  }

  async revokeToken(token: string, ttlSeconds: number = DEFAULT_REVOCATION_TTL_SEC): Promise<void> {
    if (!token) return;
    const hash = hashTokenForStorage(token);
    this.revokedTokenHashes.set(hash, Date.now() + ttlSeconds * 1000);
    if (this.revokedTokenHashes.size > 20000) {
      const firstKey = this.revokedTokenHashes.keys().next().value;
      if (firstKey) this.revokedTokenHashes.delete(firstKey);
    }
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    if (!token) return false;
    const hash = hashTokenForStorage(token);
    const expiresAt = this.revokedTokenHashes.get(hash);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
      this.revokedTokenHashes.delete(hash);
      return false;
    }
    return true;
  }
}

/**
 * Shared Redis REST Adapter (Upstash-compatible) using zero external npm dependencies.
 * Executes atomic INCR + PEXPIRE pipelines for rate limiting and SET EX / GET for token revocation.
 */
class UpstashRedisRestStore implements SharedRateLimitStore, SharedTokenRevocationStore {
  readonly backend = "upstash-redis-rest" as const;
  readonly distributedReliable = true;

  private fallback = new ProcessLocalStateStore();

  constructor(private readonly url: string, private readonly token: string) {}

  private async runPipeline(commands: Array<Array<string | number>>): Promise<Array<{ result?: unknown; error?: string }>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    try {
      const response = await fetch(`${this.url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commands),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Upstash REST pipeline failed with HTTP ${response.status}`);
      }
      return (await response.json()) as Array<{ result?: unknown; error?: string }>;
    } finally {
      clearTimeout(timeout);
    }
  }

  async consumeWindow(key: string, maxRequests: number, windowMs: number): Promise<DistributedRateLimitResult> {
    const now = Date.now();
    const redisKey = `pdfsun:rl:${key}`;
    try {
      const results = await this.runPipeline([
        ["INCR", redisKey],
        ["PTTL", redisKey],
      ]);
      const count = Number(results?.[0]?.result ?? 1);
      let pttl = Number(results?.[1]?.result ?? -1);
      if (pttl < 0) {
        await this.runPipeline([["PEXPIRE", redisKey, windowMs]]);
        pttl = windowMs;
      }
      return {
        count,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - count),
        resetAtMs: now + Math.max(1000, pttl),
        allowed: count <= maxRequests,
        backend: this.backend,
      };
    } catch (err) {
      this.lastErrorMessage = err instanceof Error ? err.message : String(err);
      this.lastErrorAt = Date.now();
      console.warn("[DistributedStateStore] Redis rate-limit call degraded to process-local fallback:", err);
      return this.fallback.consumeWindow(key, maxRequests, windowMs);
    }
  }

  async revokeToken(token: string, ttlSeconds: number = DEFAULT_REVOCATION_TTL_SEC): Promise<void> {
    if (!token) return;
    await this.fallback.revokeToken(token, ttlSeconds);
    const redisKey = `pdfsun:revoked:${hashTokenForStorage(token)}`;
    try {
      await this.runPipeline([["SET", redisKey, "1", "EX", Math.max(60, Math.floor(ttlSeconds))]]);
    } catch (err) {
      this.lastErrorMessage = err instanceof Error ? err.message : String(err);
      this.lastErrorAt = Date.now();
      console.warn("[DistributedStateStore] Redis token revocation write failed (local cache updated):", err);
    }
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    if (!token) return false;
    if (await this.fallback.isTokenRevoked(token)) return true;
    const redisKey = `pdfsun:revoked:${hashTokenForStorage(token)}`;
    try {
      const results = await this.runPipeline([["GET", redisKey]]);
      const revoked = results?.[0]?.result === "1";
      if (revoked) {
        await this.fallback.revokeToken(token, 3600);
      }
      return revoked;
    } catch (err) {
      this.lastErrorMessage = err instanceof Error ? err.message : String(err);
      this.lastErrorAt = Date.now();
      // Fail-closed in production: never permit potentially revoked tokens when shared revocation store is unreachable
      if (process.env.NODE_ENV === "production") {
        console.error("[DistributedStateStore] Production Redis revocation lookup failed — failing closed:", err);
        return true;
      }
      return false;
    }
  }

  private lastErrorAt: number | null = null;
  private lastErrorMessage: string | null = null;

  getHealthMetadata(): { degraded: boolean; lastErrorAt: number | null; lastErrorMessage: string | null } {
    const recentlyFailed = this.lastErrorAt !== null && Date.now() - this.lastErrorAt < 60_000;
    return {
      degraded: recentlyFailed,
      lastErrorAt: this.lastErrorAt,
      lastErrorMessage: recentlyFailed ? this.lastErrorMessage : null,
    };
  }
}

const localFallbackSingleton = new ProcessLocalStateStore();
let cachedUpstashKey = "";
let cachedUpstashStore: UpstashRedisRestStore | null = null;

export function getDistributedStateStore(): SharedRateLimitStore & SharedTokenRevocationStore {
  const cfg = getUpstashConfig();
  if (!cfg) {
    return localFallbackSingleton;
  }
  const cacheKey = `${cfg.url}:${cfg.token.slice(0, 8)}`;
  if (!cachedUpstashStore || cachedUpstashKey !== cacheKey) {
    cachedUpstashStore = new UpstashRedisRestStore(cfg.url, cfg.token);
    cachedUpstashKey = cacheKey;
  }
  return cachedUpstashStore;
}

export function getDistributedStateDiagnostics(): DistributedStateDiagnostics {
  const store = getDistributedStateStore();
  if (store.distributedReliable) {
    return {
      mode: "upstash-redis-rest",
      distributedReliable: true,
      rateLimitingShared: true,
      tokenRevocationShared: true,
      statusNote: "Shared Redis REST store configured for cross-instance rate limiting and token revocation.",
    };
  }
  return {
    mode: "process-local-memory",
    distributedReliable: false,
    rateLimitingShared: false,
    tokenRevocationShared: false,
    statusNote:
      "Process-local in-memory fallback active. Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or Cloud Memorystore/Redis) before multi-instance or serverless production rollout.",
  };
}
