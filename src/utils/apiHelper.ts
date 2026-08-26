/**
 * Safe API request & Network utility for PDFSun
 * Prevents "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * by safely reading raw text and handling empty or non-JSON server responses gracefully.
 * Includes automated Retry with Exponential Backoff for transient network glitches.
 */

/**
 * Standardized error message extractor for API, network, and exception objects.
 * Prevents [object Object] and Minified React Error #31 by always returning a clean string.
 */
export function getErrorMessage(err: any): string {
  if (!err) return "An unexpected error occurred.";
  if (typeof err === "string") return err.trim();

  // Handle Axios / Fetch response objects: err.response.data
  if (err?.response?.data) {
    const data = err.response.data;
    if (typeof data === "string") return data;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    if (data.error && typeof data.error === "object") {
      if (typeof data.error.message === "string") return data.error.message;
      try {
        return JSON.stringify(data.error);
      } catch {
        return "An unexpected server error occurred.";
      }
    }
  }

  // Handle Firebase / Auth error objects with { code, message }
  if (err?.code && typeof err.code === "string" && err?.message && typeof err.message === "string") {
    return err.message;
  }

  // Handle Error instances or objects with .message
  if (typeof err.message === "string" && err.message.trim() && err.message !== "[object Object]") {
    return err.message.trim();
  }

  // Handle objects with .error property
  if (err?.error) {
    if (typeof err.error === "string") return err.error;
    if (typeof err.error.message === "string") return err.error.message;
    if (typeof err.error === "object") {
      try {
        return JSON.stringify(err.error);
      } catch {
        return "An error occurred.";
      }
    }
  }

  // Handle description / statusText
  if (typeof err.error_description === "string") return err.error_description;
  if (typeof err.statusText === "string" && err.statusText) return err.statusText;

  // Generic object serialization fallback
  if (typeof err === "object") {
    try {
      const serialized = JSON.stringify(err);
      if (serialized && serialized !== "{}") return serialized;
    } catch {}
  }

  const str = String(err);
  return str === "[object Object]" ? "An unexpected error occurred. Please try again." : str;
}

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
          const isHtml = text.trim().startsWith("<") || text.includes("<!DOCTYPE") || text.includes("<html");
          const safeMessage = isHtml
            ? (res.status === 404 ? "The requested service endpoint was not found (HTTP 404)." : `Server error (HTTP ${res.status}).`)
            : text.substring(0, 200);
          parsedData = {
            success: res.ok,
            message: safeMessage,
            error: res.ok ? "Invalid server response format." : safeMessage,
          };
        }
      } else {
        parsedData = {
          success: res.ok,
          message: res.ok ? "Success" : `Empty response from server (HTTP ${res.status})`,
        };
      }

      const hasError = !res.ok || (parsedData && parsedData.success === false);
      let errorMessage: string | undefined = undefined;

      if (hasError) {
        if (typeof parsedData?.error === "string") {
          errorMessage = parsedData.error;
        } else if (parsedData?.error?.message && typeof parsedData.error.message === "string") {
          errorMessage = parsedData.error.message;
        } else if (typeof parsedData?.message === "string") {
          errorMessage = parsedData.message;
        } else if (parsedData?.error && typeof parsedData.error === "object") {
          errorMessage = getErrorMessage(parsedData.error);
        } else if (parsedData?.message && typeof parsedData.message === "object") {
          errorMessage = getErrorMessage(parsedData.message);
        } else {
          errorMessage = `Request failed with status ${res.status}`;
        }
      }

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

      const cleanErrorMsg = getErrorMessage(networkError);
      return {
        ok: false,
        status: 0,
        data: { success: false, error: cleanErrorMsg } as any,
        error: cleanErrorMsg || "Network connection error. Local offline processing is still available.",
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
