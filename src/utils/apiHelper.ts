/**
 * Safe API request & Network utility for PDFSun
 * Prevents "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * by safely reading raw text and handling empty or non-JSON server responses gracefully.
 * Includes automated Retry with Exponential Backoff for transient network glitches.
 */

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
  isOffline?: boolean;
}

export interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

/**
 * Executes a network fetch with Exponential Backoff retry capability.
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: FetchOptions
): Promise<SafeApiResponse<T>> {
  const maxRetries = init?.retries ?? 2;
  const baseDelay = init?.retryDelayMs ?? 400;

  // Check offline status before triggering network calls
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      ok: false,
      status: 0,
      isOffline: true,
      data: { success: false, offline: true } as any,
      error: "Client is offline. Client-side WebAssembly processing remains fully available.",
    };
  }

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const res = await fetch(input, {
        ...init,
        headers: {
          Accept: "application/json",
          ...(init?.headers || {}),
        },
      });

      // Transient server status codes eligible for retry
      const isTransientServerError = res.status === 502 || res.status === 503 || res.status === 504;
      if (isTransientServerError && attempt < maxRetries) {
        attempt++;
        const backoff = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      const text = await res.text();
      let parsedData: any = null;

      if (text && text.trim().length > 0) {
        try {
          parsedData = JSON.parse(text);
        } catch (parseError) {
          parsedData = {
            success: res.ok,
            message: text.substring(0, 200),
            error: res.ok ? "Invalid server response format." : `Server responded with HTTP ${res.status}`,
          };
        }
      } else {
        parsedData = {
          success: res.ok,
          message: res.ok ? "Success" : `Empty response from server (HTTP ${res.status})`,
        };
      }

      const hasError = !res.ok || (parsedData && parsedData.success === false && parsedData.error);
      const errorMessage = hasError
        ? parsedData?.error || parsedData?.message || `Request failed with status ${res.status}`
        : undefined;

      return {
        ok: res.ok && (!parsedData || parsedData.success !== false),
        status: res.status,
        data: parsedData as T,
        error: errorMessage,
      };
    } catch (networkError: any) {
      if (attempt < maxRetries) {
        attempt++;
        const backoff = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      return {
        ok: false,
        status: 0,
        data: { success: false, error: networkError?.message || "Network connection error." } as any,
        error: networkError?.message || "Network connection error. Local offline processing is still available.",
      };
    }
  }

  return {
    ok: false,
    status: 0,
    data: { success: false, error: "Network request failed after retries." } as any,
    error: "Network request failed after retries.",
  };
}
